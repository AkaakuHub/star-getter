import { expect, it } from 'vite-plus/test';
import { createApSpeedChangeEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/apSpeedChange';
import { createAddVoltageEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/addVoltage';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import {
  apIncreaseIntervalSeconds,
  applyApSpeedPercent,
} from '@akaakuhub/suku-sute-core/game/effects/apSpeed';
import { handCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import { startIngameMission } from '@akaakuhub/suku-sute-core/game/ingameMissions';
import { registerProxySkill } from '@akaakuhub/suku-sute-core/game/effects/proxySkill';
import { game } from './support/game';
import { voltageThreshold } from '@akaakuhub/suku-sute-core/game/live/voltageLevel';

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

it('Proxyに吸収されたActionType7も参照実装のEffectAmountでミッションへ通知する', () => {
  const initial = missionState(7, 50);
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const proxy = registerProxySkill(
    initial,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 3000n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 7, targetAmount: 50 }],
      effects: [],
    },
    card,
  );
  const changed = applyEffect(startIngameMission(proxy, 7n), {
    kind: 'mental-barrier',
    barrier: 'endurance',
    enduranceType: 'fixed',
    endurance: 50,
    attenuation: 1,
    duration: { kind: 'stage' },
  });
  expect(changed.mentalBarriers).toHaveLength(0);
  expect(changed.ingameMission?.cooldownSeconds).toBe(1);
  expect(changed.ingameMission?.count).toBe(50);
});

it('ActionType21通知は実際に登録されたAP時間倍率を使う', () => {
  const initial = {
    ...missionState(21, 3000),
    handEffectCardIds: [],
    targetBoosts: [],
    amplification: 100,
  };
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
  expect(changed.ingameMission?.count).toBe(31);
  expect(changed.ingameMission?.cooldownSeconds).toBe(0);
});

it('ActionType21加算通知は既存Buff適用後のAP基準時間を使う', () => {
  const base = missionState(21, 6000);
  const initial = {
    ...base,
    track: { ...base.track, stage: { ...base.track.stage, apIncreaseIntervalSeconds: 1 } },
  };
  const card = initial.deck[0];
  if (!card) throw new Error('カードがありません。');
  const priorBuff = applyApSpeedPercent(initial, -100, 'stage');
  const effect = createApSpeedChangeEffect({
    skillEffectId: 22n,
    details: [
      { id: 1n, detailType: 'CHANGE_AP_INCREASE_SPEED_CALC_TYPE', targetMood: 0, value: 1n },
      { id: 2n, detailType: 'CHANGE_AP_INCREASE_SPEED_NUM', targetMood: 0, value: -500n },
      {
        id: 3n,
        detailType: 'CHANGE_AP_INCREASE_SPEED_DISPLAY_TIME_TYPE',
        targetMood: 0,
        value: 3n,
      },
    ],
  });
  const changed = applyEffect(startIngameMission(priorBuff, 21n), effect, card);
  expect(changed.ingameMission?.count).toBe(25);
  expect(apIncreaseIntervalSeconds(changed)).toBeCloseTo(1, 5);
  expect(changed.ingameMission?.cooldownSeconds).toBe(0);
});

it('負のActionType20効果はActionType44ミッション数を減らさない', () => {
  const initial = missionState(20, 1);
  const changed = applyEffect(startIngameMission(initial, 20n), handCardCountEffect(-1, 3, 0n));
  expect(changed.ingameMission?.count).toBe(0);
});

it('子効果で発動したActionType14もActionType44へ通知する', () => {
  const initial = missionState(14, 2);
  const changed = applyEffect(startIngameMission(initial, 14n), {
    kind: 'branch',
    condition: { kind: 'heat', minimum: 0 },
    whenTrue: [{ kind: 'ap', amount: 2 }],
    whenFalse: [],
  });
  expect(changed.ingameMission?.cooldownSeconds).toBe(1);
});

it('ActionType10は熱気無限中もEffectAmountをミッションへ通知する', () => {
  const initial = missionState(10, 10);
  const capped = {
    ...initial,
    maximumVoltageLevel: 1,
    voltage: { ...initial.voltage, currentVoltage: BigInt(voltageThreshold(1)) },
  };
  const effect = createAddVoltageEffect({
    skillEffectId: 10n,
    details: [
      { id: 1n, detailType: 'ADD_VOLTAGE_NUM', value: 100_000n },
      { id: 2n, detailType: 'ADD_VOLTAGE_NUM_TYPE', value: 1n },
    ],
  });
  const infinite = applyEffect(capped, {
    kind: 'infinity-gauge',
    gauge: 'voltage',
    duration: { kind: 'stage', value: 0 },
  });
  const changed = applyEffect(startIngameMission(infinite, 10n), effect);
  expect(changed.voltage.currentVoltage).toBe(capped.voltage.currentVoltage);
  expect(changed.ingameMission?.cooldownSeconds).toBe(1);
});

it('Proxyに吸収されたActionType2は既存Boost量でミッションを進めない', () => {
  const initial = missionState(2, 1);
  const card = initial.deck[0];
  if (!card) throw new Error('Proxy発動元カードがありません。');
  const withPreviousBoost = applyEffect(initial, { kind: 'boost', multiplier: 1.05 });
  const proxy = registerProxySkill(
    withPreviousBoost,
    {
      kind: 'proxy-skill',
      absorbLimit: 1,
      periodType: 1,
      periodParam: 3000n,
      induceTiming: 1,
      induceCondition: 1,
      inducePowerType: 1,
      inducePowerParam: 0n,
      targets: [{ actionType: 2, targetAmount: 20 }],
      effects: [],
    },
    card,
  );
  const changed = applyEffect(startIngameMission(proxy, 2n), {
    kind: 'boost',
    multiplier: 1.05,
  });
  expect(changed.boosts).toHaveLength(withPreviousBoost.boosts.length);
  expect(changed.ingameMission?.count).toBe(0);
  expect(changed.ingameMission?.cooldownSeconds).toBe(0);
});
