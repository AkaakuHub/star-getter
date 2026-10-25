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
  return startGaugeRegeneration(
    state,
    effect.gauge,
    base,
    effect.intervalType,
    effect.intervalMilliseconds,
    effect.duration,
  );
}
