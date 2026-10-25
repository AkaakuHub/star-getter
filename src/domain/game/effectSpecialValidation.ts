import { validateMentalRecoverAdditionalBuffEffect } from './mentalRecoverAdditionalBuffTypes';
import type { Effect } from './model';
import { validateDeckSkillCostChange } from './skillCostChangeTypes';
import { validateLoveUpAdditionalBuffEffect } from './loveUpAdditionalBuffTypes';
import { validateVoltageUpAdditionalBuffEffect } from './voltageUpAdditionalBuffTypes';

type SpecialEffect = Extract<
  Effect,
  {
    kind:
      | 'deck-skill-cost-change'
      | 'love-up-additional-buff'
      | 'voltage-up-additional-buff'
      | 'recover-mental-additional-buff';
  }
>;

export function validateSpecialEffect(effect: Effect): boolean {
  if (!isSpecialEffect(effect)) return false;
  switch (effect.kind) {
    case 'deck-skill-cost-change':
      validateDeckSkillCostChange(effect);
      break;
    case 'love-up-additional-buff':
      validateLoveUpAdditionalBuffEffect(effect);
      break;
    case 'voltage-up-additional-buff':
      validateVoltageUpAdditionalBuffEffect(effect);
      break;
    case 'recover-mental-additional-buff':
      validateMentalRecoverAdditionalBuffEffect(effect);
      break;
  }
  return true;
}

function isSpecialEffect(effect: Effect): effect is SpecialEffect {
  return (
    effect.kind === 'deck-skill-cost-change' ||
    effect.kind === 'love-up-additional-buff' ||
    effect.kind === 'voltage-up-additional-buff' ||
    effect.kind === 'recover-mental-additional-buff'
  );
}
