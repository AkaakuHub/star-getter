import { skillValue } from './skillValue';
import { addMentalBarrier } from '../live/mentalBarriers';
import type { MentalBarrierEffect } from '../modelTypes';
import type { Card, GameState } from '../model';

export function applyMentalBarrier(
  state: GameState,
  effect: MentalBarrierEffect,
  card: Card | undefined,
  multiplier: number,
): GameState {
  const value = (amount: number) =>
    Math.fround(skillValue(state, amount, effect, card) * multiplier);
  return addMentalBarrier(
    state,
    effect,
    effect.enduranceType === 'infinite' ? 0 : value(effect.endurance),
    value(effect.attenuation),
  );
}
