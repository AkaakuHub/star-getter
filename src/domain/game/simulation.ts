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
import { fillHand } from './cards/drawing';
import { createStarGatherHeartRuntimeState } from './live/heartSpawn';
import { recordScoreHistory } from './scoreHistory';
import { recordMoodHistory } from './moodHistory';
import {
  starGatherHeartShowLimitSettings,
  resolveStarGatherHeartDrawCount,
} from './live/heartPresentation';

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
    modes: createModes(deck.flatMap((card) => card.modeIds ?? [])),
    modeReactions: [],
    phase: 'ready',
    tick: 0,
    track,
    deck: [...deck],
    cardPool: [...deck],
    hand: [lead.id],
    handEffectCardIds: [lead.id],
    drawPile: deck.filter((card) => card.id !== lead.id).map((card) => card.id),
    deckOutCount: 0,
    discard: [],
    tokenCatalog,
    nextTokenId: 1,
    tokenGroups: [],
    tokenBoosts: [],
    handLimit: rules.handSize,
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
  return fillHand(initial);
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
  const gauges = advanceAutomaticGauges(state, dt);
  let next: GameState = advanceHearts({
    ...gauges,
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
  const previousBeat = Math.floor((state.tick * state.track.bpm) / (60 * rules.ticksPerSecond));
  const beat = Math.floor((tick * state.track.bpm) / (60 * rules.ticksPerSecond));
  if (beat !== previousBeat && beat % 2 === 0 && !next.resting) {
    next = addHearts(next, beatHeartCount(next));
  }
  if (sectionAt(next) !== sectionAt(state))
    next = fillHand({
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
      handLimit: rules.handSize,
      moodOffset: 0,
      sectionMentalProtected: false,
      sectionBeatHeartBonus: 0,
      beatPointBuffs: next.beatPointBuffs.flatMap((buff) => {
        if (buff.remainingSections === null) return [buff];
        const remainingSections = buff.remainingSections - 1;
        return remainingSections > 0 ? [{ ...buff, remainingSections }] : [];
      }),
      apIntervalFactor: 1,
      amplification: next.amplification - next.sectionAmplification,
      sectionAmplification: 0,
      targetBoosts: next.targetBoosts.filter((boost) => boost.duration === 'stage'),
    });
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
