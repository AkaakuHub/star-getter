import { validateDeck, shuffle } from './deck';
import { addHearts, collectHearts, advanceHearts } from './hearts';
import { type Card, type GameState, type Track, rules } from './model';
import { durationSeconds, sectionAt } from './projection';
import { changeBloomResource, finishBloom } from './bloom';
import { createLoveGatherHeartRuntimeState } from './live/heartSpawn';
import {
  loveGatherHeartShowLimitSettings,
  resolveLoveGatherHeartDrawCount,
} from './live/heartPresentation';

export function createGame(
  track: Track,
  deck: readonly Card[],
  seed: number,
  heartShowLimit: number = loveGatherHeartShowLimitSettings.defaultValue,
): GameState {
  validateDeck(deck);
  validateTrack(track);
  resolveLoveGatherHeartDrawCount(0, heartShowLimit);
  const shuffled = shuffle(
    deck.map((card) => card.id),
    seed,
  );
  return {
    phase: 'ready',
    tick: 0,
    track,
    deck: [...deck],
    hand: shuffled.items.slice(0, rules.handSize),
    drawPile: shuffled.items.slice(rules.handSize),
    discard: [],
    randomSeed: shuffled.seed,
    energy: 10,
    stamina: 100,
    resting: false,
    excitement: 0,
    charge: 0,
    score: 0n,
    hearts: {
      ...createLoveGatherHeartRuntimeState((track.beats * 60) / track.bpm),
      showLimit: heartShowLimit,
      throwLimit: heartShowLimit,
      showPercentage: 100,
    },
    heartRandomSeed: seed,
    boosts: [],
    amplification: 100n,
    resourceBoosts: [],
    bloom: null,
    relayUsed: [],
    combo: 0,
    lastCollectTick: -rules.comboWindowTicks - 1,
    lastActionTick: -rules.actionCooldownTicks,
    lastPerformer: null,
    lastCardName: '',
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
    return { ...finishBloom(collected), phase: 'finished' };
  }
  return next;
}

function advanceTick(state: GameState): GameState {
  const tick = state.tick + 1;
  const dt = 1 / rules.ticksPerSecond;
  const stamina = state.bloom
    ? state.stamina
    : state.resting
      ? Math.min(100, state.stamina + 4 * dt)
      : Math.max(0, state.stamina - 0.9 * dt);
  const resting = state.resting ? stamina < 40 : stamina <= 0;
  let next: GameState = advanceHearts({
    ...state,
    tick,
    stamina,
    resting,
    energy: state.bloom
      ? state.energy
      : Math.min(
          rules.maxEnergy,
          (Math.round(state.energy * rules.energyTicksPerPoint) + (resting ? 0 : 1)) /
            rules.energyTicksPerPoint,
        ),
    excitement: state.bloom ? state.excitement : Math.min(100, state.excitement + dt * 0.25),
    combo: tick - state.lastCollectTick > rules.comboWindowTicks ? 0 : state.combo,
    boosts: state.boosts.filter((boost) => boost.untilTick > tick),
  });
  if (next.bloom && tick % rules.energyTicksPerPoint === 0)
    next = changeBloomResource(next, 'energy', 1n);
  const previousBeat = Math.floor((state.tick * state.track.bpm) / (60 * rules.ticksPerSecond));
  const beat = Math.floor((tick * state.track.bpm) / (60 * rules.ticksPerSecond));
  if (beat !== previousBeat && beat % 2 === 0 && !resting) {
    const section = sectionAt(next);
    const moodPerformer = { warm: 'nova', cool: 'lumen', bright: 'tetra' } as const;
    const affinity = state.deck.filter(
      (card) => card.performer === moodPerformer[section.mood],
    ).length;
    const count = 1 + Math.floor(affinity / 3) + (section.climax ? 1 : 0);
    next = addHearts(next, stamina >= 30 ? count : 1);
  }
  return next;
}

function validateTrack(track: Track): void {
  if (
    !Number.isFinite(track.bpm) ||
    track.bpm < 30 ||
    track.bpm > 300 ||
    !Number.isInteger(track.beats) ||
    track.beats < 1 ||
    track.beats > 2000 ||
    track.targetScore <= 0n ||
    track.sections[0]?.startBeat !== 0
  )
    throw new Error('楽曲の設定が正しくありません。');
  let previous = -1;
  for (const section of track.sections) {
    if (
      !Number.isInteger(section.startBeat) ||
      section.startBeat <= previous ||
      section.startBeat >= track.beats
    ) {
      throw new Error('区間の順番が正しくありません。');
    }
    previous = section.startBeat;
  }
}
