import { voltageLevel } from '../live/voltageLevel';
import type { Card, Effect, GameState } from '../model';

type VoltageTierEffect = Extract<Effect, { kind: 'voltage-tier' }>;
type ApplyEffect = (
  state: GameState,
  effect: Effect,
  card?: Card,
  multiplier?: number,
  addValue?: number,
) => GameState;

export function applyVoltageTier(
  state: GameState,
  effect: VoltageTierEffect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
  applyEffect: ApplyEffect,
): GameState {
  if (state.bloom)
    return effect.tiers.reduceRight(
      (next, tier) =>
        tier.reduce(
          (current, child) => applyEffect(current, child, card, multiplier, addValue),
          next,
        ),
      state,
    );
  const tier =
    effect.tiers[
      Math.min(
        effect.tiers.length - 1,
        Math.floor(voltageLevel(state.excitement, state.maximumVoltageLevel) / effect.step),
      )
    ];
  if (!tier) throw new Error('熱気の段階に対応する効果がありません。');
  return tier.reduce((next, child) => applyEffect(next, child, card, multiplier, addValue), state);
}
