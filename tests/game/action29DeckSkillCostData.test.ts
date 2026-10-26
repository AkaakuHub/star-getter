import { expect, it } from 'vite-plus/test';
import { createDeckSkillCostChangeEffect } from '../../src/domain/game/actionTypeEffects/deckSkillCostChange';

it('ActionType29はlong詳細値をint32化してデッキ対象条件を作る', () => {
  const effect = createDeckSkillCostChangeEffect({
    skillEffectId: 29n,
    details: [
      { id: 1n, detailType: 'CHANGE_DECK_AP_NUM', value: (1n << 32n) - 10n },
      { id: 2n, detailType: 'CHANGE_DECK_AP_TARGET_RANGE', value: 3n },
      { id: 3n, detailType: 'CHANGE_DECK_AP_TARGET_TYPE', value: 5n },
      { id: 4n, detailType: 'CHANGE_DECK_AP_TARGET_TYPE_ID', value: (1n << 32n) + 8123n },
    ],
  });

  expect(effect).toEqual({
    kind: 'deck-skill-cost-change',
    num: -10,
    targetRange: 3,
    target: 'token-series',
    targetId: 8123,
  });
});
