import type { Card, Effect, GameState } from '../model';
import { changeResource } from '../resources';
import { moodValue } from '../projection';
import { calculateSkillMoodCorrection } from '../live/skillMood';
import { applyAdditionalBuff } from './additionalBuff';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';
import type { EffectApplier } from './induceSkillEffect';

type RecoverMentalSkillEffect = Extract<Effect, { kind: 'recover-mental-skill' }>;

export function activateRecoverMentalSkill(
  state: GameState,
  effect: RecoverMentalSkillEffect,
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
  const base = Math.fround(
    Math.trunc(
      Math.fround(
        Math.fround(Math.fround(effect.amount / 10_000) + correction + addValue) * multiplier,
      ),
    ) * effectPower,
  );
  const additional = applyAdditionalBuff(state, 'stamina', Math.fround(base), card);
  const boosted = applyAction52SkillBoostForCard(
    additional.state,
    card,
    Math.trunc(additional.value),
  );
  if (effect.numberType !== 1) return boosted.state;
  const recovery = Math.trunc(Math.fround(Math.fround(boosted.value / 100) * state.maximumMental));
  return changeResource(boosted.state, 'stamina', BigInt(recovery), 'skill', card, apply);
}
