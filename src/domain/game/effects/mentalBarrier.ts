import { skillValue } from './skillValue';
import { applyAction52SkillBoost } from './action52SkillBoost';
import { addMentalBarrier } from '../live/mentalBarriers';
import { applyMentalBarrierAdditionalBuff } from './mentalBarrierAdditionalBuff';
import type { MentalBarrierEffect } from '../modelTypes';
import type { Card, GameState } from '../model';
import { induceSkillEffects, type EffectApplier } from './induceSkillEffect';

export function applyMentalBarrier(
  state: GameState,
  effect: MentalBarrierEffect,
  card: Card | undefined,
  multiplier: number,
  addValue = 0,
  effectPower = 1,
  applyEffect?: EffectApplier,
): GameState {
  const value = (amount: number) =>
    Math.fround(Math.fround(skillValue(state, amount, effect, card) + addValue) * multiplier);
  const baseEndurance = Math.fround(value(effect.endurance) * effectPower);
  const additional = applyMentalBarrierAdditionalBuff(state, card, baseEndurance);
  const boosted = card
    ? applyAction52SkillBoost(additional.state, card, additional.value)
    : { state: additional.state, value: additional.value };
  const endurance = effect.enduranceType === 'infinite' ? 0 : Math.trunc(boosted.value);
  const next = addMentalBarrier(boosted.state, effect, endurance, value(effect.attenuation));
  if (!applyEffect || next.mentalBarriers.length === boosted.state.mentalBarriers.length)
    return next;
  return induceSkillEffects(
    next,
    'mental-barrier',
    endurance === 0 ? 100 : Math.trunc(endurance),
    applyEffect,
  );
}
