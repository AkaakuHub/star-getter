import { expect, it } from 'vite-plus/test';
import { createMentalHeartInduceEffect } from '../../src/domain/game/actionTypeEffects/mentalHeartInduce';

it('ActionType23はlong詳細値のint32化とパート期限のlong保持を行う', () => {
  const effect = createMentalHeartInduceEffect({
    skillEffectId: 23n,
    details: [
      { id: 1n, detailType: 'MENTAL_HEART_INDUCE_NUM', value: (1n << 32n) + 10_000n },
      { id: 2n, detailType: 'MENTAL_HEART_INDUCE_HEART_DISPLAY_TIME_TYPE', value: 1n },
      { id: 3n, detailType: 'MENTAL_HEART_INDUCE_HEART_DISPLAY_TIME', value: (1n << 32n) + 250n },
      { id: 4n, detailType: 'MENTAL_HEART_INDUCE_DISPLAY_TIME_TYPE', value: 2n },
      {
        id: 5n,
        detailType: 'MENTAL_HEART_INDUCE_DISPLAY_TIME',
        value: (1n << 53n) + 1n,
      },
      { id: 6n, detailType: 'MENTAL_HEART_INDUCE_DISABLED_TYPE', value: 1n },
      { id: 7n, detailType: 'MENTAL_HEART_INDUCE_DISABLED', value: (1n << 53n) + 3n },
    ],
  });

  expect(effect).toMatchObject({
    kind: 'mental-heart-induce',
    num: (1n << 32n) + 10_000n,
    heartDuration: { kind: 'milliseconds', value: 250 },
    duration: { kind: 'sections', value: (1n << 53n) + 1n },
    disabledType: 1,
    disabledValue: (1n << 53n) + 3n,
  });
});
