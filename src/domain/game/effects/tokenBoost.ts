import { applyAction52SkillBoost } from './action52SkillBoost';
import type { Card, Effect, GameState } from '../model';

export function activateTokenBoost(
  state: GameState,
  effect: Extract<Effect, { kind: 'token-boost' }>,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
): GameState {
  const num = int32(effect.num);
  const base = Math.fround(
    Math.fround(Math.fround(numToValue(num) + Math.fround(addValue)) * Math.fround(multiplier)),
  );
  if (base <= 0) return state;
  if (!card) throw new Error('追加カード増幅の発動元カードがありません。');
  const boosted = applyAction52SkillBoost(state, card, base);
  const value = Number.isFinite(boosted.value) ? boosted.value : -3.4028234663852886e38;
  const suppressDuration = effect.invocationType === 0x388 || effect.invocationType === 0x38b;
  return {
    ...boosted.state,
    tokenBoosts: [
      ...boosted.state.tokenBoosts,
      {
        calculation: effect.calculation,
        value,
        target: effect.target,
        ...(effect.seriesIds ? { seriesIds: effect.seriesIds } : {}),
        remainingUses: effect.uses ?? null,
        remainingSeconds:
          suppressDuration || effect.duration?.kind !== 'milliseconds'
            ? null
            : Math.fround(effect.duration.value / 1000),
        remainingSections:
          suppressDuration || effect.duration?.kind !== 'sections' ? null : effect.duration.value,
        deactivationKey: effect.deactivationKey ?? null,
      },
    ],
  };
}

function numToValue(value: number): number {
  return Math.fround(Math.fround(value) / Math.fround(10_000));
}

function int32(value: number): number {
  return Number(BigInt.asIntN(32, BigInt(Math.trunc(value))));
}
