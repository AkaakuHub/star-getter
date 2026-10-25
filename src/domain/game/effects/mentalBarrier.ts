import { skillValue } from './skillValue';
import { applyAction52SkillBoost } from './action52SkillBoost';
import { addMentalBarrier } from '../live/mentalBarriers';
import { applyMentalBarrierAdditionalBuff } from './mentalBarrierAdditionalBuff';
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
  const baseEndurance = Math.fround(value(effect.endurance) * effectPower);
  const additional = applyMentalBarrierAdditionalBuff(state, card, baseEndurance);
  const boosted = card
    ? applyAction52SkillBoost(additional.state, card, additional.value)
    : { state: additional.state, value: additional.value };
  const endurance = effect.enduranceType === 'infinite' ? 0 : boosted.value;
  return addMentalBarrier(boosted.state, effect, endurance, value(effect.attenuation));
}
