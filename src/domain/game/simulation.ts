import { createModes } from './live/modes';
import { advanceAutomaticGauges } from './automaticGauges';
import { moodAtTime, validateMoodTimeline } from './live/moodTimeline';
import { calculateStarGatherBaseSkillCooldownSeconds } from './live/skillCooldown';
import { beatHeartCount } from './beat';
import { validateDeck, validateCard } from './deck';
import { addHearts, collectHearts, advanceHearts, heartCount } from './hearts';
import { advanceAutomaticHeart } from './live/automaticHeart';
import { type Card, type GameState, type Track, rules } from './model';
import { durationSeconds, sectionAt, moodValue } from './projection';
import { finishBloom } from './bloom';
import { fillHand, fillHandToCountRetainingOverflow } from './cards/drawing';
import { advanceHandLimitEffects, expireHandLimitSections } from './effects/handLimit';
import { createStarGatherHeartRuntimeState } from './live/heartSpawn';
import { recordScoreHistory } from './scoreHistory';
import { recordMoodHistory } from './moodHistory';
import {
  starGatherHeartShowLimitSettings,
  resolveStarGatherHeartDrawCount,
} from './live/heartPresentation';
import { expireGaugeInfinities } from './resources';
import { advanceGaugeRegenerations, expireGaugeRegenerations } from './live/gaugeRegeneration';
import { expireMentalBarriers, removeExhaustedMentalBarriers } from './live/mentalBarriers';
import { advanceHeartBoosts, expireSectionHeartBoosts } from './live/heartBoosts';
import { initializeHandCardStats } from './cards/skillCostChanges';
import { initializeParameterValueFactors } from './parameters/parameterValueChange';

export function createGame(
  track: Track,
  deck: readonly Card[],
  seed: number,
  heartShowLimit: number = starGatherHeartShowLimitSettings.defaultValue,
  tokenCatalog: readonly Card[] = [],
): GameState {
  validateDeck(deck);
  validateTrack(track);
  for (const card of tokenCatalog) validateCard(card);
  resolveStarGatherHeartDrawCount(0, heartShowLimit);
  const lead = deck[0];
  if (!lead) throw new Error('先頭のカードがありません。');
  const initial: GameState = {
    supportLevels: {},
    modes: createModes(
      deck.flatMap((card) => [
        ...(card.modeIds ?? []),
        ...(card.modeParameterChanges ? [card.modeParameterChanges.modeId] : []),
      ]),
    ),
    modeReactions: [],
    phase: 'ready',
    tick: 0,
    track,
    deck: [...deck],
    cardPool: [...deck],
    hand: [lead.id],
    handCardStats: {},
    skillCostChanges: [],
    parameterValueFactors: [],
    parameterValueChangeCounts: {},
    activeModeParameterChanges: [],
    skillUseDestinations: {},
    handEffectCardIds: [lead.id],
    drawPile: deck.filter((card) => card.id !== lead.id).map((card) => card.id),
    deckOutCount: 0,
    discard: [],
    tokenCatalog,
    nextTokenId: 1,
    tokenGroups: [],
    tokenBoosts: [],
    handLimit: rules.handSize,
    proxyAbsorptions: [],
    handLimitEffects: [],
    drawContext: 'initial',
    deckActions: { shuffles: [], searches: [] },
    lastUsedMember: null,
    lastUsedUnit: null,
    lastUsedSkillIcon: null,
    cardUseCounts: {},
    activation: null,
    randomSeed: seed,
    energy: 0,
    maxEnergy: track.stage.maxEnergy,
    apIntervalFactor: 1,
    apStageIntervalFactor: 1,
    apTimerSeconds: 0,
    mentalTimerSeconds: 0,
    voltageTimerSeconds: 0,
    voltageStops: [],
    gaugeInfinities: [],
    gaugeRegenerations: [],
    moodOffset: 0,
    costReductions: {},
    storyAmplification: 0,
    stamina: 100,
    resting: false,
    mentalProtected: false,
    sectionMentalProtected: false,
    sectionBeatHeartBonus: 0,
    beatPointBuffs: [],
    heartBoosts: [],
    mentalShield: 0,
    mentalBarriers: [],
    excitement: 0,
    maximumVoltageLevel: 1000,
    specialUsed: [],
    score: 0n,
    scoreMultiplier: 1n,
    scoreHistory: [{ timeMilliseconds: 0, totalScore: 0n }],
    moodHistory: [{ timeMilliseconds: 0, moodValue: moodAtTime(track.moodKeys, 0) }],
    hearts: {
      ...createStarGatherHeartRuntimeState((track.beats * 60) / track.bpm),
      showLimit: heartShowLimit,
      throwLimit: heartShowLimit,
      showPercentage: 100,
    },
    heartRandomSeed: seed,
    automaticHeart: { enabled: true, timerSeconds: 0 },
    boosts: [],
    amplification: 100,
    sectionAmplification: 0,
    targetBoosts: [],
    resourceBoosts: [],
    bloom: null,
    relayUsed: [],
    handHeartCollectCounts: {},
    combo: 0,
    lastCollectTick: -rules.comboWindowTicks - 1,
    lastActionTick: -Math.ceil(
      calculateStarGatherBaseSkillCooldownSeconds(
        Math.round(((track.beats * 60) / track.bpm) * 1000),
      ) * rules.ticksPerSecond,
    ),
    skillCooldownSeconds: null,
    lastPerformer: null,
    lastCardName: '',
    cardUses: [],
    lastGain: 0n,
    stats: {
      cardsUsed: 0,
      heartsCollected: 0,
      heartsMissed: 0,
      specialsUsed: 0,
      bestCollection: 0,
      bestCombo: 0,
    },
  };
  const prepared = initializeHandCardStats(initializeParameterValueFactors(initial), [lead.id]);
  return fillHand(prepared);
}

export function advanceTo(state: GameState, seconds: number): GameState {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('ゲーム時刻が正しくありません。');
  if (state.phase !== 'playing') return state;
  const endTick = Math.round(durationSeconds(state) * rules.ticksPerSecond);
  const target = Math.min(endTick, Math.floor(seconds * rules.ticksPerSecond + 1e-7));
  let next = state;
  while (next.tick < target) next = advanceTick(next);
  if (next.tick === endTick) {
    const collected = collectHearts({ ...next, relayUsed: [...next.hand] });
    return {
      ...finishBloom(collected),
      scoreHistory: recordScoreHistory(collected.scoreHistory, {
        timeMilliseconds: Math.trunc(durationSeconds(collected) * 1000),
        totalScore: collected.score,
      }),
      moodHistory: recordMoodHistory(collected.moodHistory, {
        timeMilliseconds: Math.trunc(durationSeconds(collected) * 1000),
        moodValue: moodValue(collected),
      }),
      phase: 'finished',
    };
  }
  return next;
}

function advanceTick(state: GameState): GameState {
  const tick = state.tick + 1;
  const dt = 1 / rules.ticksPerSecond;
  const gauges = removeExhaustedMentalBarriers(
    expireMentalBarriers(
      advanceGaugeRegenerations(
        expireGaugeInfinities(advanceAutomaticGauges(state, dt), 'milliseconds', dt),
        dt,
      ),
      'milliseconds',
      dt,
    ),
  );
  let next: GameState = advanceHearts({
    ...advanceHeartBoosts(gauges, dt),
    tick,
    voltageStops: state.voltageStops.flatMap((stop) => {
      if (stop.remainingSeconds === null) return [stop];
      const remainingSeconds = Math.fround(stop.remainingSeconds - Math.fround(dt));
      return remainingSeconds > 0 ? [{ ...stop, remainingSeconds }] : [];
    }),
    tokenBoosts: state.tokenBoosts.flatMap((boost) => {
      if (boost.remainingSeconds === null) return [boost];
      const remainingSeconds = Math.fround(boost.remainingSeconds - Math.fround(dt));
      return remainingSeconds > 0 ? [{ ...boost, remainingSeconds }] : [];
    }),
    cardUses: state.cardUses.filter((use) => tick - use.tick < rules.ticksPerSecond),
    combo: tick - state.lastCollectTick > rules.comboWindowTicks ? 0 : state.combo,
    boosts: state.boosts.filter((boost) => boost.untilTick > tick),
  });
  const elapsedHandLimit = advanceHandLimitEffects(next, dt);
  next = elapsedHandLimit.state;
  if (elapsedHandLimit.handAdjustment > 0) {
    next = restoreHandLimitCount(next, elapsedHandLimit.handAdjustment);
  }
  const previousBeat = Math.floor((state.tick * state.track.bpm) / (60 * rules.ticksPerSecond));
  const beat = Math.floor((tick * state.track.bpm) / (60 * rules.ticksPerSecond));
  if (beat !== previousBeat && beat % 2 === 0) {
    if (!next.resting) next = addHearts(next, beatHeartCount(next));
    next = expireGaugeRegenerations(next, 'heart-event');
  }
  if (sectionAt(next) !== sectionAt(state)) {
    const expiredHandLimit = expireHandLimitSections(next);
    next = expiredHandLimit.state;
    if (expiredHandLimit.handAdjustment > 0) {
      next = restoreHandLimitCount(next, expiredHandLimit.handAdjustment);
    }
    next = expireGaugeInfinities(next, 'sections', 1);
    next = expireGaugeRegenerations(next, 'sections');
    next = expireMentalBarriers(next, 'sections', 1);
    next = {
      ...next,
      voltageStops: next.voltageStops.flatMap((stop) => {
        if (stop.remainingSections === null) return [stop];
        const remainingSections = stop.remainingSections - 1;
        return remainingSections > 0 ? [{ ...stop, remainingSections }] : [];
      }),
      tokenBoosts: next.tokenBoosts.flatMap((boost) => {
        if (boost.remainingSections === null) return [boost];
        const remainingSections = boost.remainingSections - 1;
        return remainingSections > 0 ? [{ ...boost, remainingSections }] : [];
      }),
      moodOffset: 0,
      sectionMentalProtected: false,
      sectionBeatHeartBonus: 0,
      beatPointBuffs: next.beatPointBuffs.flatMap((buff) => {
        if (buff.remainingSections === null) return [buff];
        const remainingSections = buff.remainingSections - 1;
        return remainingSections > 0 ? [{ ...buff, remainingSections }] : [];
      }),
      heartBoosts: expireSectionHeartBoosts(next.heartBoosts),
      skillCostChanges: next.skillCostChanges.flatMap((change) => {
        if (change.remainingSections === null) return [change];
        const remainingSections = change.remainingSections - 1;
        return remainingSections > 0 ? [{ ...change, remainingSections }] : [];
      }),
      apIntervalFactor: 1,
      amplification: next.amplification - next.sectionAmplification,
      sectionAmplification: 0,
      targetBoosts: next.targetBoosts.filter((boost) => boost.duration === 'stage'),
    };
  }
  const automatic = advanceAutomaticHeart(next.automaticHeart, heartCount(next), dt);
  next = { ...next, automaticHeart: automatic.state };
  const collected = automatic.shouldCollect ? collectHearts(next) : next;
  const mood = moodValue(collected);
  return mood === collected.moodHistory.at(-1)?.moodValue
    ? collected
    : {
        ...collected,
        moodHistory: recordMoodHistory(collected.moodHistory, {
          timeMilliseconds: Math.trunc((tick * 1000) / rules.ticksPerSecond),
          moodValue: mood,
        }),
      };
}

function restoreHandLimitCount(state: GameState, adjustment: number): GameState {
  const target = Math.min(
    state.deck.length,
    Math.max(3, Math.min(8, state.hand.length + adjustment)),
  );
  return fillHandToCountRetainingOverflow(state, target);
}

function validateTrack(track: Track): void {
  if (
    !Number.isFinite(track.bpm) ||
    track.bpm < 30 ||
    track.bpm > 300 ||
    !Number.isInteger(track.beats) ||
    track.beats < 1 ||
    track.beats > 2000 ||
    track.sections[0]?.startBeat !== 0
  )
    throw new Error('ステージの設定が正しくありません。');
  let previous = -1;
  for (const section of track.sections) {
    if (
      !Number.isFinite(section.startBeat) ||
      section.startBeat <= previous ||
      section.startBeat >= track.beats
    ) {
      throw new Error('区間の設定が正しくありません。');
    }
    previous = section.startBeat;
  }
  validateMoodTimeline(track.moodKeys, (track.beats * 60) / track.bpm);
}
