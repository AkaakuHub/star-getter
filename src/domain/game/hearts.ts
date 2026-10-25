import { applyEffect } from './effects';
import { flushDeckActions } from './cards/boardActions';
import { type GameState, rules } from './model';
import { collectionScore, limitValue } from './scoring';
import { collectStarGatherHeartRuntime, advanceStarGatherHeartRuntime } from './live/heartRuntime';
import { spawnStarGatherBeatHearts } from './live/heartSpawn';
import { starGatherHeartCount } from './live/heartState';
import { createRangeRandom } from './random';
import { advanceHandCollectionAbilities } from './cards/collectionAbilities';
import { recordScoreHistory } from './scoreHistory';
import { voltageLevel } from './live/voltageLevel';

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
    scoreHistory: recordScoreHistory(state.scoreHistory, {
      timeMilliseconds: Math.trunc((state.tick * 1000) / rules.ticksPerSecond),
      totalScore: score,
    }),
    combo,
    lastCollectTick: missed ? state.lastCollectTick : state.tick,
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
  const abilities = advanceHandCollectionAbilities(next, collected.collectCount);
  let triggered = abilities.state;
  for (const card of abilities.activated) {
    const relay = card.relay;
    if (relay) {
      triggered = applyEffect(
        triggered,
        {
          kind: relay.beats ? 'beat-hearts' : 'hearts',
          amount: relay.hearts,
          ...(relay.moodBonus ? { moodBonus: relay.moodBonus } : {}),
        },
        card,
      );
    } else if (card.collectionAbility) {
      if (
        voltageLevel(triggered.excitement, triggered.maximumVoltageLevel) >= 950 &&
        triggered.stamina / 100 < Math.fround(1 / 1_000_000)
      ) {
        triggered = applyEffect(triggered, { kind: 'shuffle' }, card);
        if (card.collectionAbility === 'icy-kosuzu')
          triggered = applyEffect(triggered, { kind: 'search-unit', unit: 2, count: 4 }, card);
        triggered = applyEffect(triggered, { kind: 'excitement', amount: -1_400_000 }, card);
        if (voltageLevel(triggered.excitement, triggered.maximumVoltageLevel) >= 1000)
          triggered = applyEffect(triggered, { kind: 'excitement', amount: -14_000_000 }, card);
      }
    } else if (state.deck.length >= 95) {
      triggered =
        card.token === 'story'
          ? applyEffect(
              triggered,
              { kind: 'beat-hearts', amount: 1001, moodBonus: { target: 1, perPoint: 5.005 } },
              card,
            )
          : applyEffect(triggered, { kind: 'shuffle' }, card);
    }
  }
  return flushDeckActions(triggered);
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
