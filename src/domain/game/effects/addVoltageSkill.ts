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
  const initial = Math.fround(
    Math.fround(int32(effect.amount)) / Math.fround(10_000) + Math.fround(correction),
  );
  const combined = Math.fround(
    Math.fround(Math.fround(initial + Math.fround(addValue)) * Math.fround(multiplier)) *
      Math.fround(effectPower),
  );
  const base = Math.fround(int32(combined));
  const additional = applyAdditionalBuff(state, 'excitement', base, card);
  const boosted = applyAction52SkillBoostForCard(additional.state, card, int32(additional.value));
  if (effect.numberType !== 1) return boosted.state;
  return changeResource(
    boosted.state,
    'excitement',
    BigInt(int32(boosted.value)),
    'skill',
    card,
    apply,
    true,
  );
}

function int32(value: number): number {
  return Number(BigInt.asIntN(32, BigInt(Math.trunc(value))));
}
