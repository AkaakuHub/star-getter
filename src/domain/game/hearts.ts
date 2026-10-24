import { type GameState, rules } from './model';
import { collectionScore, limitValue } from './scoring';
import { collectLoveGatherHeartRuntime, advanceLoveGatherHeartRuntime } from './live/heartRuntime';
import { spawnLoveGatherBeatHearts } from './live/heartSpawn';
import { loveGatherHeartCount } from './live/heartState';
import { createRangeRandom } from './random';

export function heartCount(state: GameState): number {
  return loveGatherHeartCount(state.hearts);
}

function awardHearts(state: GameState, count: number, missed: boolean): GameState {
  if (count === 0) return state;
  const gain = collectionScore(state, count, missed);
  const score = limitValue(state.score + gain);
  const combo = missed
    ? state.combo
    : state.tick - state.lastCollectTick <= rules.comboWindowTicks
      ? state.combo + 1
      : 1;
  return {
    ...state,
    score,
    combo,
    lastCollectTick: missed ? state.lastCollectTick : state.tick,
    charge: Math.min(100, state.charge + (missed ? 0 : count * 0.8)),
    lastGain: missed ? state.lastGain : score - state.score,
    stats: {
      ...state.stats,
      heartsCollected: state.stats.heartsCollected + (missed ? 0 : count),
      heartsMissed: state.stats.heartsMissed + (missed ? count : 0),
      bestCollection: Math.max(state.stats.bestCollection, missed ? 0 : count),
      bestCombo: Math.max(state.stats.bestCombo, missed ? 0 : combo),
    },
  };
}

export function collectHearts(state: GameState): GameState {
  if (heartCount(state) === 0) return state;
  const random = createRangeRandom(state.heartRandomSeed);
  const collected = collectLoveGatherHeartRuntime(state.hearts, random.range);
  const next = awardHearts(
    { ...state, hearts: collected.state, heartRandomSeed: random.seed },
    collected.collectCount,
    false,
  );
  const relays = state.deck.filter(
    (card) =>
      state.hand.includes(card.id) &&
      !state.relayUsed.includes(card.id) &&
      card.relay &&
      collected.collectCount >= card.relay.threshold,
  );
  const generated = relays.reduce((sum, card) => sum + (card.relay?.hearts ?? 0), 0);
  return addHearts(
    { ...next, relayUsed: [...next.relayUsed, ...relays.map((card) => card.id)] },
    generated,
  );
}

export function addHearts(state: GameState, count: number): GameState {
  if (count === 0) return state;
  const random = createRangeRandom(state.heartRandomSeed);
  const spawned = spawnLoveGatherBeatHearts(state.hearts, count, random.range);
  return awardHearts(
    { ...state, hearts: spawned.state, heartRandomSeed: random.seed },
    spawned.overflowCount,
    true,
  );
}

export function advanceHearts(state: GameState): GameState {
  const advanced = advanceLoveGatherHeartRuntime(state.hearts, 1 / rules.ticksPerSecond, false);
  return awardHearts({ ...state, hearts: advanced.state }, advanced.lapsedCount, true);
}
