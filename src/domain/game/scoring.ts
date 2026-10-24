import { type GameState, rules } from './model';
import { sectionAt } from './projection';

export function limitValue(value: bigint): bigint {
  return value > rules.maxScore ? rules.maxScore : value < 0n ? 0n : value;
}

export function integerSqrt(value: bigint): bigint {
  if (value < 0n) throw new Error('平方根には0以上の整数を指定してください。');
  if (value < 2n) return value;
  let root = 1n << BigInt(Math.ceil(value.toString(2).length / 2));
  let next = (root + value / root) / 2n;
  while (next < root) {
    root = next;
    next = (root + value / root) / 2n;
  }
  return root;
}

function scoreMultiplier(state: GameState): bigint {
  const level = Math.floor(state.excitement / 2);
  let factor = BigInt(100 + level * 25);
  if (sectionAt(state).climax) factor = (factor * 150n) / 100n;
  for (const boost of state.boosts) factor = limitValue((factor * (100n + boost.percent)) / 100n);
  if (state.bloom) {
    const progress = state.bloom.progress;
    factor = limitValue((factor * (100n + integerSqrt(progress ** 3n))) / 100n);
  }
  return factor;
}

export function collectionScore(
  state: GameState,
  count: number,
  combo: number,
  missed: boolean,
): bigint {
  const appealSum = state.deck.reduce((sum, card) => sum + BigInt(card.appeal), 0n);
  const appealBase = (appealSum * 120_000n) / BigInt(state.deck.length);
  const chain = missed ? 1n : 10n ** BigInt(Math.min(combo, 72));
  return limitValue(
    (appealBase * BigInt(count) * scoreMultiplier(state) * chain) / (missed ? 500n : 100n),
  );
}
