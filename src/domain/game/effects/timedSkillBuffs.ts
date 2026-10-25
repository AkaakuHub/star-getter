import type { GameState } from '../model';
import { advanceAction52SkillBoosts, expireAction52SkillBoostSections } from './action52SkillBoost';
import {
  advanceLoveUpAdditionalBuffs,
  expireLoveUpAdditionalBuffSections,
} from './loveUpAdditionalBuff';

export function advanceTimedSkillBuffs(state: GameState, elapsedSeconds: number): GameState {
  return advanceLoveUpAdditionalBuffs(
    advanceAction52SkillBoosts(state, elapsedSeconds),
    elapsedSeconds,
  );
}

export function expireTimedSkillBuffSections(state: GameState): GameState {
  return expireLoveUpAdditionalBuffSections(expireAction52SkillBoostSections(state));
}
