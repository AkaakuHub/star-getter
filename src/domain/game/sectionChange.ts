import type { GameState } from './model';
import type { EffectApplier } from './effects/induceSkillEffect';
import { notifyHandSectionChange } from './cards/handInduce';
import { expireTokenDeckSplitSections } from './effects/tokenDeckSplit';
import { expireSkillCooldownSections } from './effects/skillCooldown';
import { expireInducedSkillEffectSections } from './effects/induceSkillEffect';
import { expireApSpeedSections } from './effects/apSpeed';
import { expireVoltageConversionSections } from './effects/voltageConversion';
import { expireTimedSkillBuffSections } from './effects/timedSkillBuffs';
import { expireMentalHeartInducerSections } from './effects/mentalHeartInduce';
import { expireComboInducerSections } from './effects/comboInduce';
import { expireHeartLimitBuffSections } from './effects/heartLimit';
import { expireAdditionalHeartInducerSections } from './effects/additionalHeart';
import { advanceProxySkillSections } from './effects/proxySkill';
import { expireHandLimitSections } from './effects/handLimit';
import { restoreHandLimitCount } from './cards/drawing';
import { expireGaugeInfinities } from './resources';
import { expireGaugeRegenerations } from './live/gaugeRegeneration';
import { expireMentalBarriers } from './live/mentalBarriers';
import { expireVoltageIncreaseStopSections } from './effects/stopVoltageIncrease';
import { expireSectionHeartBoosts } from './live/heartBoosts';
import { expireBeatPointBuffSections } from './effects/beatPointBuff';

export function advanceSectionChange(state: GameState, applyEffect: EffectApplier): GameState {
  let next = expireTokenDeckSplitSections(state);
  next = expireSkillCooldownSections(next);
  next = expireInducedSkillEffectSections(next);
  next = expireApSpeedSections(next);
  next = expireVoltageConversionSections(next);
  next = expireTimedSkillBuffSections(next);
  next = expireMentalHeartInducerSections(next);
  next = expireComboInducerSections(next);
  next = expireHeartLimitBuffSections(next);
  next = expireAdditionalHeartInducerSections(next);
  next = advanceProxySkillSections(next, applyEffect);
  const expiredHandLimit = expireHandLimitSections(next);
  next = expiredHandLimit.state;
  if (expiredHandLimit.handAdjustment > 0)
    next = restoreHandLimitCount(next, expiredHandLimit.handAdjustment);
  next = expireGaugeInfinities(next, 'sections', 1);
  next = expireGaugeRegenerations(next, 'sections');
  next = expireMentalBarriers(next, 'sections', 1);
  next = expireVoltageIncreaseStopSections(next);
  next = expireBeatPointBuffSections(next);
  next = {
    ...next,
    tokenBoosts: next.tokenBoosts.flatMap((boost) => {
      if (boost.remainingSections === null) return [boost];
      const remainingSections = boost.remainingSections - 1;
      return remainingSections > 0 ? [{ ...boost, remainingSections }] : [];
    }),
    skillScoreUps: next.skillScoreUps.flatMap((boost) => {
      if (boost.remainingSections === null) return [boost];
      const remainingSections = boost.remainingSections - 1;
      return remainingSections > 0 ? [{ ...boost, remainingSections }] : [];
    }),
    moodOffset: 0,
    sectionMentalProtected: false,
    sectionBeatHeartBonus: 0,
    heartBoosts: expireSectionHeartBoosts(next.heartBoosts),
    skillCostChanges: next.skillCostChanges.flatMap((change) => {
      if (change.remainingSections === null) return [change];
      const remainingSections = change.remainingSections - 1;
      return remainingSections > 0 ? [{ ...change, remainingSections }] : [];
    }),
    amplification: next.amplification - next.sectionAmplification,
    sectionAmplification: 0,
    targetBoosts: next.targetBoosts.filter((boost) => boost.duration === 'stage'),
  };
  return notifyHandSectionChange(next, applyEffect);
}
