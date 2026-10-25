import { applyAction52SkillBoost } from './action52SkillBoost';
import { int64ToFloat32 } from '../numeric';
import type { Card, Effect, GameState } from '../model';

export function activateTokenBoost(
  state: GameState,
  effect: Extract<Effect, { kind: 'token-boost' }>,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
): GameState {
  const numValue = Math.fround(int64ToFloat32(BigInt(effect.num)) / Math.fround(10_000));
  const base = Math.fround(
    Math.fround(Math.fround(numValue + Math.fround(addValue)) * Math.fround(multiplier)),
  );
  const boosted =
    base > 0 && card ? applyAction52SkillBoost(state, card, base) : { state, value: base };
  const value = base > 0 && card ? toInt32(boosted.value) : base;
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

function toInt32(value: number): number {
  if (!Number.isFinite(value) || value < -2_147_483_648 || value > 2_147_483_647)
    return -2_147_483_648;
  return Math.trunc(value);
}
