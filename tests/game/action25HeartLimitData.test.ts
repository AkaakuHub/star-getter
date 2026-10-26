import { expect, it } from 'vite-plus/test';
import { createHeartLimitChangeEffect } from '../../src/domain/game/actionTypeEffects/heartLimitChange';

it('ActionType25はlongの詳細値・対象Mood・期限を保持して計算種別をint32化する', () => {
  const effect = createHeartLimitChangeEffect({
    skillEffectId: 25n,
    details: [
      {
        id: 1n,
        detailType: 'CHANGE_HEART_LIMIT_CALC_TYPE',
        targetMood: 0,
        value: (1n << 32n) + 2n,
      },
      { id: 2n, detailType: 'CHANGE_HEART_LIMIT_NUM', targetMood: 0, value: (1n << 53n) + 7n },
      {
        id: 3n,
        detailType: 'CHANGE_HEART_LIMIT_NUM_BONUS_MOOD',
        targetMood: 2,
        value: (1n << 53n) + 9n,
      },
      { id: 4n, detailType: 'CHANGE_HEART_LIMIT_DISPLAY_TIME_TYPE', targetMood: 0, value: 2n },
      {
        id: 5n,
        detailType: 'CHANGE_HEART_LIMIT_DISPLAY_TIME',
        targetMood: 0,
        value: (1n << 53n) + 1n,
      },
    ],
  });

  expect(effect).toMatchObject({
    kind: 'heart-limit-change',
    calculationType: 2,
    num: (1n << 53n) + 7n,
    bonusMoodTarget: 2,
    bonusMoodValue: (1n << 53n) + 9n,
    duration: { kind: 'sections', value: (1n << 53n) + 1n },
  });
});
