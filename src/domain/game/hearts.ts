import { type GameState, rules } from './model';
import { scoreMultiplier } from './projection';

export function collectHearts(state: GameState, count: number, missed = false): GameState {
  const collected = state.hearts.slice(0, count);
  if (!collected.length) return state;
  const appeal = state.deck.reduce((sum, card) => sum + card.appeal, 0) / state.deck.length;
  const gain = Math.floor(collected.length * appeal * scoreMultiplier(state) * (missed ? 0.2 : 1));
  return {
    ...state,
    hearts: state.hearts.slice(collected.length),
    score: state.score + gain,
    charge: Math.min(100, state.charge + (missed ? 0 : collected.length * 0.8)),
    lastGain: gain,
    stats: {
      ...state.stats,
      heartsCollected: state.stats.heartsCollected + (missed ? 0 : collected.length),
      heartsMissed: state.stats.heartsMissed + (missed ? collected.length : 0),
      bestCollection: Math.max(state.stats.bestCollection, missed ? 0 : collected.length),
    },
  };
}

export function addHearts(state: GameState, count: number): GameState {
  const hearts = Array.from({ length: count }, (_, index) => ({
    id: state.nextHeartId + index,
    bornTick: state.tick,
  }));
  const added = {
    ...state,
    hearts: [...state.hearts, ...hearts],
    nextHeartId: state.nextHeartId + count,
  };
  const overflow = Math.max(0, added.hearts.length - rules.maxHearts);
  return overflow ? collectHearts(added, overflow, true) : added;
}

export function expireHearts(state: GameState): GameState {
  const expired = state.hearts.filter(
    (heart) => state.tick - heart.bornTick >= rules.heartLifetimeSeconds * rules.ticksPerSecond,
  ).length;
  return expired ? collectHearts(state, expired, true) : state;
}
