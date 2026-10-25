import { skillValue } from './skillValue';
import { applyAction52SkillBoost } from './action52SkillBoost';
import { startGaugeRegeneration } from '../live/gaugeRegeneration';
import type { GaugeRegenerationEffect } from '../modelTypes';
import type { Card, GameState } from '../model';

export function applyGaugeRegeneration(
  state: GameState,
  effect: GaugeRegenerationEffect,
  card: Card | undefined,
  multiplier: number,
  addValue = 0,
  effectPower = 1,
): GameState {
  const base = Math.fround(
    Math.fround(
      Math.fround(skillValue(state, effect.amount, effect, card) + addValue) * multiplier,
    ) * effectPower,
  );
  const boosted = card ? applyAction52SkillBoost(state, card, base) : { state, value: base };
  return startGaugeRegeneration(
    boosted.state,
    effect.gauge,
    boosted.value,
    effect.intervalType,
    effect.intervalMilliseconds,
    effect.duration,
    card?.id ?? null,
  );
}
