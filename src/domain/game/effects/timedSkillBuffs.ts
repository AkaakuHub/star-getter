import {
  advanceDisableMentalDownEffects,
  expireDisableMentalDownEffectSections,
} from './disableMentalDown';
import {
  advanceMentalBarrierAdditionalBuffs,
  expireMentalBarrierAdditionalBuffSections,
} from './mentalBarrierAdditionalBuff';
import {
  advanceMentalRecoverAdditionalBuffs,
  expireMentalRecoverAdditionalBuffSections,
} from './mentalRecoverAdditionalBuff';
import type { GameState } from '../model';
import { advanceAction52SkillBoosts, expireAction52SkillBoostSections } from './action52SkillBoost';
import {
  advanceLoveUpAdditionalBuffs,
  expireLoveUpAdditionalBuffSections,
} from './loveUpAdditionalBuff';
import {
  advanceVoltageUpAdditionalBuffs,
  expireVoltageUpAdditionalBuffSections,
} from './voltageUpAdditionalBuff';
import { advanceBeatHeartValueBuffs, expireBeatHeartValueBuffSections } from './beatHeartValueBuff';
import { advanceMoodChangeSkills, expireMoodChangeSkillSections } from './moodChangeSkill';

export function advanceTimedSkillBuffs(state: GameState, elapsedSeconds: number): GameState {
  return advanceMoodChangeSkills(
    advanceBeatHeartValueBuffs(
      advanceDisableMentalDownEffects(
        advanceMentalBarrierAdditionalBuffs(
          advanceMentalRecoverAdditionalBuffs(
            advanceVoltageUpAdditionalBuffs(
              advanceLoveUpAdditionalBuffs(
                advanceAction52SkillBoosts(state, elapsedSeconds),
                elapsedSeconds,
              ),
              elapsedSeconds,
            ),
            elapsedSeconds,
          ),
          elapsedSeconds,
        ),
        elapsedSeconds,
      ),
      elapsedSeconds,
    ),
    elapsedSeconds,
  );
}

export function expireTimedSkillBuffSections(state: GameState): GameState {
  return expireMoodChangeSkillSections(
    expireBeatHeartValueBuffSections(
      expireDisableMentalDownEffectSections(
        expireMentalBarrierAdditionalBuffSections(
          expireMentalRecoverAdditionalBuffSections(
            expireVoltageUpAdditionalBuffSections(
              expireLoveUpAdditionalBuffSections(expireAction52SkillBoostSections(state)),
            ),
          ),
        ),
      ),
    ),
  );
}
