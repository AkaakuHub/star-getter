import { expect, it } from 'vite-plus/test';
import { createAdditionalHeartInduceEffect } from '../../src/domain/game/actionTypeEffects/additionalHeart';

it('ActionType27はlong詳細値から条件・AP倍率・期限を生成する', () => {
  const effect = createAdditionalHeartInduceEffect({
    skillEffectId: 27n,
    details: [
      { id: 1n, detailType: 'GET_ADDITIONAL_HEART_INDUCE_TYPE', value: 3n },
      { id: 2n, detailType: 'GET_ADDITIONAL_HEART_INDUCE_VALUE', value: (1n << 32n) + 2n },
      { id: 3n, detailType: 'GET_ADDITIONAL_HEART_EFFECT_ID', value: 100n },
      { id: 4n, detailType: 'GET_ADDITIONAL_HEART_AP_POWER', value: (1n << 53n) + 1n },
      { id: 5n, detailType: 'GET_ADDITIONAL_HEART_DISPLAY_TIME_TYPE', value: 2n },
      {
        id: 6n,
        detailType: 'GET_ADDITIONAL_HEART_DISPLAY_TIME',
        value: (1n << 53n) + 3n,
      },
    ],
    heartEffect: {
      kind: 'skill-hearts',
      skillEffectId: 100n,
      calculation: 'fixed',
      amount: 10_000,
      displayTime: { kind: 'full-end', value: 0 },
    },
  });

  expect(effect).toMatchObject({
    kind: 'additional-heart-induce',
    condition: { kind: 'unit', unit: 2 },
    apPower: (1n << 53n) + 1n,
    duration: { kind: 'sections', value: (1n << 53n) + 3n },
  });
});
