import { applyEffect } from './effects';
import { fillHand, shuffleHand } from './cards/drawing';
import { type GameState, rules } from './model';
import { collectionScore, limitValue } from './scoring';
import { collectStarGatherHeartRuntime, advanceStarGatherHeartRuntime } from './live/heartRuntime';
import { spawnStarGatherBeatHearts } from './live/heartSpawn';
import { starGatherHeartCount } from './live/heartState';
import { createRangeRandom } from './random';

export function heartCount(state: GameState): number {
  return starGatherHeartCount(state.hearts);
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
  const collected = collectStarGatherHeartRuntime(state.hearts, random.range);
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
  let triggered: GameState = {
    ...next,
    relayUsed: [...next.relayUsed, ...relays.map((card) => card.id)],
  };
  for (const card of relays) {
    const relay = card.relay;
    if (!relay) throw new Error('回収能力がありません。');
    triggered = applyEffect(
      triggered,
      { kind: relay.beats ? 'beat-hearts' : 'hearts', amount: relay.hearts },
      card,
    );
  }
  const tokenReactions = state.deck.filter(
    (card) =>
      state.hand.includes(card.id) &&
      !state.relayUsed.includes(card.id) &&
      state.deck.length >= 95 &&
      collected.collectCount >= 500_000 &&
      (card.token === 'story' || card.token === 'bookmark'),
  );
  for (const card of tokenReactions) {
    triggered = { ...triggered, relayUsed: [...triggered.relayUsed, card.id] };
    triggered =
      card.token === 'story'
        ? applyEffect(
            triggered,
            { kind: 'beat-hearts', amount: 1001, moodBonus: { target: 1, perPoint: 5.005 } },
            card,
          )
        : fillHand(shuffleHand(triggered));
  }
  return triggered;
}

export function addHearts(state: GameState, count: number): GameState {
  if (count === 0) return state;
  const random = createRangeRandom(state.heartRandomSeed);
  const spawned = spawnStarGatherBeatHearts(state.hearts, count, random.range);
  return awardHearts(
    { ...state, hearts: spawned.state, heartRandomSeed: random.seed },
    spawned.overflowCount,
    true,
  );
}

export function advanceHearts(state: GameState): GameState {
  const advanced = advanceStarGatherHeartRuntime(state.hearts, 1 / rules.ticksPerSecond, false);
  return awardHearts({ ...state, hearts: advanced.state }, advanced.lapsedCount, true);
}
