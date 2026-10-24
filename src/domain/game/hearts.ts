import { type GameState, rules } from './model';
import { collectionScore, limitValue } from './scoring';

export function collectHearts(state: GameState, count: number, missed = false): GameState {
  const collected = state.hearts.slice(0, count);
  if (!collected.length) return state;
  const combo = missed
    ? state.combo
    : state.tick - state.lastCollectTick <= rules.comboWindowTicks
      ? Math.min(72, state.combo + 1)
      : 1;
  const gain = collectionScore(state, collected.length, combo, missed);
  const score = limitValue(state.score + gain);
  const next: GameState = {
    ...state,
    hearts: state.hearts.slice(collected.length),
    score,
    combo,
    lastCollectTick: missed ? state.lastCollectTick : state.tick,
    charge: Math.min(100, state.charge + (missed ? 0 : collected.length * 0.8)),
    lastGain: missed ? state.lastGain : score - state.score,
    stats: {
      ...state.stats,
      heartsCollected: state.stats.heartsCollected + (missed ? 0 : collected.length),
      heartsMissed: state.stats.heartsMissed + (missed ? collected.length : 0),
      bestCollection: Math.max(state.stats.bestCollection, missed ? 0 : collected.length),
      bestCombo: Math.max(state.stats.bestCombo, missed ? 0 : combo),
    },
  };
  if (missed) return next;
  const relays = state.deck.filter(
    (card) =>
      state.hand.includes(card.id) &&
      !state.relayUsed.includes(card.id) &&
      card.relay &&
      collected.length >= card.relay.threshold,
  );
  const generated = relays.reduce((sum, card) => sum + (card.relay?.hearts ?? 0), 0);
  return addHearts(
    { ...next, relayUsed: [...next.relayUsed, ...relays.map((card) => card.id)] },
    generated,
  );
}

export function addHearts(state: GameState, count: number): GameState {
  if (count === 0) return state;
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
