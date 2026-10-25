import { applyAdditionalBuff } from './additionalBuff';
import { skillValue } from './skillValue';
import { startGaugeRegeneration } from '../live/gaugeRegeneration';
import type { GaugeRegenerationEffect } from '../modelTypes';
import type { Card, GameState } from '../model';

export function applyGaugeRegeneration(
  state: GameState,
  effect: GaugeRegenerationEffect,
  card: Card | undefined,
  multiplier: number,
): GameState {
  const base = Math.fround(skillValue(state, effect.amount, effect, card) * multiplier);
  const boosted =
    base > 0
      ? applyAdditionalBuff(state, effect.gauge === 'mental' ? 'stamina' : 'excitement', base, card)
      : { state, value: base };
  return startGaugeRegeneration(
    boosted.state,
    effect.gauge,
    boosted.value,
    effect.intervalType,
    effect.intervalMilliseconds,
    effect.duration,
  );
}
