import { advanceAutomaticGauges } from './automaticGauges';
import { calculateStarGatherBaseSkillCooldownSeconds } from './live/skillCooldown';
import { applyDrawAbility } from './cards/drawAbilities';
import { beatHeartCount } from './beat';
import { validateDeck, validateCard, shuffle } from './deck';
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
  const shuffled = shuffle(
    deck.map((card) => card.id),
    seed,
  );
  const lead = deck[0];
  if (!lead) throw new Error('先頭のカードがありません。');
  const firstSection = track.sections[0];
  if (!firstSection) throw new Error('最初のパートがありません。');
  const ordered = [lead.id, ...shuffled.items.filter((id) => id !== lead.id)];
  const initial: GameState = {
    phase: 'ready',
    tick: 0,
    track,
    deck: [...deck],
    cardPool: [...deck],
    hand: [lead.id],
    drawPile: ordered.slice(1),
    discard: [],
    tokenCatalog,
    nextTokenId: 1,
    handLimit: rules.handSize,
    drawContext: 'initial',
    lastUsedMember: null,
    lastUsedUnit: null,
    cardUseCounts: {},
    activation: null,
    randomSeed: shuffled.seed,
    energy: 10,
    maxEnergy: rules.maxEnergy,
    apIntervalFactor: 1,
    apStageIntervalFactor: 1,
    apTimerSeconds: 0,
    mentalTimerSeconds: 0,
    voltageTimerSeconds: 0,
    moodOffset: 0,
    costReductions: {},
    storyAmplification: 0,
    stamina: 100,
    resting: false,
    mentalProtected: false,
    excitement: 0,
    maximumVoltageLevel: 1000,
    specialUsed: [],
    score: 0n,
    scoreMultiplier: 1n,
    scoreHistory: [{ timeMilliseconds: 0, totalScore: 0n }],
    moodHistory: [{ timeMilliseconds: 0, moodValue: firstSection.moodValue }],
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
  const drawn = initial.hand.reduce((next, id) => {
    const card = next.deck.find((item) => item.id === id);
    if (!card) throw new Error('開始時の手札がありません。');
    return applyDrawAbility(next, card);
  }, initial);
  return fillHand(drawn);
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
      handLimit: rules.handSize,
      moodOffset: 0,
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
      !Number.isSafeInteger(section.moodValue) ||
      section.moodValue < -100 ||
      section.moodValue > 100 ||
      !Number.isInteger(section.startBeat) ||
      section.startBeat <= previous ||
      section.startBeat >= track.beats
    ) {
      throw new Error('区間の設定が正しくありません。');
    }
    previous = section.startBeat;
  }
}
