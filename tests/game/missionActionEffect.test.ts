import { expect, it } from 'vite-plus/test';
import { createApSpeedChangeEffect } from '../../src/domain/game/actionTypeEffects/apSpeedChange';
import { applyEffect } from '../../src/domain/game/effects';
import { handCardCountEffect } from '../../src/domain/game/actionTypeEffects/handCardCount';
import { startIngameMission } from '../../src/domain/game/ingameMissions';
import { game } from './support/game';

function missionState(actionType: number, target: number) {
  const initial = game();
  return {
    ...initial,
    track: {
      ...initial.track,
      ingameMissionGroups: [
        {
          id: actionType,
          records: [
            {
              missionType: 2 as const,
              probability: 100,
              rare: false,
              param1: target,
              param2: actionType,
              addParam: 0,
              baseScore: 0,
              addScore: 0,
              text: '対象効果を$TargetValue$回実行',
            },
          ],
        },
      ],
    },
  };
}

it('ActionType7通知は割合適用後の実際のバリア耐久値を使う', () => {
  const initial = { ...missionState(7, 50), maximumMental: 200 };
  const started = startIngameMission(initial, 7n);
  const changed = applyEffect(started, {
    kind: 'mental-barrier',
    barrier: 'endurance',
    enduranceType: 'ratio',
    endurance: 25,
    attenuation: 1,
    duration: { kind: 'stage' },
  });
  expect(changed.mentalBarriers[0]?.endurance).toBe(50);
  expect(changed.ingameMission?.cooldownSeconds).toBe(1);
});

it('ActionType21通知は実際に登録されたAP時間倍率を使う', () => {
  const initial = missionState(21, 3000);
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const effect = createApSpeedChangeEffect({
    skillEffectId: 21n,
    details: [
      { id: 1n, detailType: 'CHANGE_AP_INCREASE_SPEED_CALC_TYPE', targetMood: 0, value: 2n },
      { id: 2n, detailType: 'CHANGE_AP_INCREASE_SPEED_NUM', targetMood: 0, value: 7000n },
      {
        id: 3n,
        detailType: 'CHANGE_AP_INCREASE_SPEED_DISPLAY_TIME_TYPE',
        targetMood: 0,
        value: 3n,
      },
    ],
  });
  const changed = applyEffect(startIngameMission(initial, 21n), effect, card);
  expect(changed.ingameMission?.cooldownSeconds).toBe(1);
});

it('負のActionType20効果はActionType44ミッション数を減らさない', () => {
  const initial = missionState(20, 1);
  const changed = applyEffect(startIngameMission(initial, 20n), handCardCountEffect(-1, 3, 0n));
  expect(changed.ingameMission?.count).toBe(0);
});
