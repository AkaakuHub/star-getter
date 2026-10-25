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
  addValue = 0,
  effectPower = 1,
): GameState {
  const value = (amount: number) =>
    Math.fround(Math.fround(skillValue(state, amount, effect, card) + addValue) * multiplier);
  const endurance =
    effect.enduranceType === 'infinite' ? 0 : Math.fround(value(effect.endurance) * effectPower);
  const boosted = card
    ? applyAction52SkillBoost(state, card, endurance)
    : { state, value: endurance };
  return addMentalBarrier(boosted.state, effect, boosted.value, value(effect.attenuation));
}
