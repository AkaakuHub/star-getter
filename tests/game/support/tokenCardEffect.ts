import type { TokenCardEffect } from '@akaakuhub/suku-sute-core/game/tokenRequestTypes';

export function tokenCardEffect(
  resourceId: number,
  count: bigint,
  seriesIds: readonly bigint[] = [],
  styleType = 1,
): TokenCardEffect {
  return {
    kind: 'token-card',
    resourceId,
    count,
    styleType,
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
      variant: { consumeAp: 1, effects: [], skillIcon: 0, special: null },
    },
    ability: null,
    seriesIds,
  };
}
