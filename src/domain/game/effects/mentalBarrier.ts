import { skillValue } from './skillValue';
import { applyAction52SkillBoost } from './action52SkillBoost';
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
  const endurance = effect.enduranceType === 'infinite' ? 0 : value(effect.endurance);
  const boosted = card
    ? applyAction52SkillBoost(state, card, endurance)
    : { state, value: endurance };
  return addMentalBarrier(boosted.state, effect, boosted.value, value(effect.attenuation));
}
