import { validateDeck, shuffle } from './deck';
import { addHearts, collectHearts, expireHearts } from './hearts';
import { type Card, type GameState, type Track, rules } from './model';
import { durationSeconds, sectionAt } from './projection';

export function createGame(track: Track, deck: readonly Card[], seed: number): GameState {
  validateDeck(deck);
  validateTrack(track);
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
    energy: 5,
    stamina: 100,
    resting: false,
    excitement: 0,
    charge: 0,
    score: 0,
    hearts: [],
    nextHeartId: 0,
    boosts: [],
    lastActionTick: -rules.actionCooldownTicks,
    lastPerformer: null,
    lastCardName: '',
    lastGain: 0,
    stats: {
      cardsUsed: 0,
      heartsCollected: 0,
      heartsMissed: 0,
      specialsUsed: 0,
      bestCollection: 0,
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
    return { ...collectHearts(next, next.hearts.length), phase: 'finished' };
  }
  return next;
}

function advanceTick(state: GameState): GameState {
  const tick = state.tick + 1;
  const dt = 1 / rules.ticksPerSecond;
  const stamina = state.resting
    ? Math.min(100, state.stamina + 4 * dt)
    : Math.max(0, state.stamina - 0.9 * dt);
  const resting = state.resting ? stamina < 40 : stamina <= 0;
  let next: GameState = expireHearts({
    ...state,
    tick,
    stamina,
    resting,
    energy: Math.min(
      rules.maxEnergy,
      (Math.round(state.energy * rules.energyTicksPerPoint) + (resting ? 0 : 1)) /
        rules.energyTicksPerPoint,
    ),
    excitement: Math.min(100, state.excitement + dt * 0.25),
    boosts: state.boosts.filter((boost) => boost.untilTick > tick),
  });
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
    !Number.isFinite(track.targetScore) ||
    track.targetScore <= 0 ||
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
