import type { AddVoltageSkillEffect } from '../addVoltageTypes';
import type { Card, GameState } from '../model';
import type { EffectApplier } from './induceSkillEffect';
import { changeResource } from '../resources';
import { moodValue } from '../projection';
import { calculateSkillMoodCorrection } from '../live/skillMood';
import { applyAdditionalBuff } from './additionalBuff';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';

export function activateAddVoltageSkill(
  state: GameState,
  effect: AddVoltageSkillEffect,
  card: Card | undefined,
  multiplier: number,
  addValue: number,
  effectPower: number,
  apply: EffectApplier,
): GameState {
  const correction = effect.moodBonus
    ? calculateSkillMoodCorrection(
        effect.moodBonus.target,
        moodValue(state),
        effect.moodBonus.perPoint,
      )
    : 0;
  const initial = Math.fround(Math.fround(effect.amount / 10_000) + correction);
  const combined = Math.fround(Math.fround(initial + addValue) * multiplier);
  const base = Math.fround(Math.trunc(Math.fround(combined * effectPower)));
  const additional = applyAdditionalBuff(state, 'excitement', base, card);
  const boosted = applyAction52SkillBoostForCard(
    additional.state,
    card,
    Math.trunc(additional.value),
  );
  if (effect.numberType !== 1) return boosted.state;
  return changeResource(
    boosted.state,
    'excitement',
    BigInt(Math.trunc(boosted.value)),
    'skill',
    card,
    apply,
    true,
  );
}
