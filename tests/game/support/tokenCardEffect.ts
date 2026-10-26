import type { TokenCardEffect } from '../../../src/domain/game/tokenRequestTypes';

export function tokenCardEffect(
  resourceId: number,
  count: bigint,
  seriesIds: readonly bigint[] = [],
  style = 1,
): TokenCardEffect {
  return {
    kind: 'token-card',
    resourceId,
    count,
    style,
    mood: 1,
    skillSeriesId: 0,
    skillLevel: 1,
    abilitySeriesId: 0,
    abilityLevel: 1,
    sourceSkillType: 2,
    sourceSkillLevel: 1,
    sourceSpecialAppealSkillLevel: 0,
    sourceSkillSkillLevel: 1,
    skill: {
      seriesId: 0,
      mainEffect: 0,
      skillIcon: 0,
      variant: { cost: 1, effects: [], skillIcon: 0, special: null },
    },
    ability: null,
    seriesIds,
  };
}
