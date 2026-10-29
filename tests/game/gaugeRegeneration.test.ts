import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { activateGenesis } from '@akaakuhub/suku-sute-core/game/genesis';
import { addLiveGenesisGauge } from '@akaakuhub/suku-sute-core/runtime/skills/genesisSkill';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { addHearts } from '@akaakuhub/suku-sute-core/game/hearts';
import { advanceSectionChange } from '@akaakuhub/suku-sute-core/game/sectionChange';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { game } from './support/game';

describe('ゲージの継続回復', () => {
  it('最大元気に対する割合を各回の元気回復量へ変換する', () => {
    const baseState = regenerationGame();
    const active = applyEffect(
      { ...baseState, maximumMental: 100, mental: { ...baseState.mental, currentMental: 40 } },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 1,
        value: 5,
        intervalType: 1,
        intervalValue: 200,
        duration: { kind: 'milliseconds', value: 600 },
      },
    );
    expect(active.mental.currentMental).toBe(45);
    expect(advanceTo(active, 0.21).mental.currentMental).toBe(50);
  });

  it('Action11は汎用スキル増幅を使わずobserverで切り上げて熱気を加算する', () => {
    const baseState2 = regenerationGame();
    const active = applyEffect(
      {
        ...baseState2,
        amplification: 200,
        voltage: { ...baseState2.voltage, currentVoltage: BigInt(500) },
      },
      {
        kind: 'gauge-regeneration',
        gauge: 'voltage',
        calculationType: 1,
        value: 10.5,
        intervalType: 1,
        intervalValue: 200,
        duration: { kind: 'milliseconds', value: 600 },
      },
    );
    expect(active.voltage.currentVoltage).toBe(511n);
    expect(advanceTo(active, 0.21).voltage.currentVoltage).toBe(522n);
  });

  it('元気は発動時に回復し、周期回復後に期限切れとなる', () => {
    const baseState3 = regenerationGame();
    const initial = { ...baseState3, mental: { ...baseState3.mental, currentMental: 40 } };
    const active = applyEffect(initial, {
      kind: 'gauge-regeneration',
      gauge: 'mental',
      calculationType: 1,
      value: 10,
      intervalType: 1,
      intervalValue: 200,
      duration: { kind: 'milliseconds', value: 600 },
    });
    expect(active.mental.currentMental).toBe(50);
    const afterDuration = advanceTo(active, 0.61);
    expect(afterDuration.mental.currentMental).toBe(80);
    expect(afterDuration.regenGaugeEffects).toHaveLength(0);
  });

  it('熱気は発動時と期限中の周期ごとに加算し、レベル上限でもポイントを保持する', () => {
    const baseState4 = regenerationGame();
    const initial = {
      ...baseState4,
      track: {
        ...baseState4.track,
        stage: { ...baseState4.track.stage, voltageIncreaseIntervalSeconds: 100 },
      },
      voltage: { ...baseState4.voltage, currentVoltage: BigInt(654_999_999) },
    };
    const active = applyEffect(initial, {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
      calculationType: 1,
      value: 10,
      intervalType: 1,
      intervalValue: 200,
      duration: { kind: 'milliseconds', value: 600 },
    });
    expect(active.voltage.currentVoltage).toBe(655_000_009n);
    expect(advanceTo(active, 0.61).voltage.currentVoltage).toBe(655_000_039n);
    expect(advanceTo(active, 0.61).regenGaugeEffects).toHaveLength(0);
  });

  it('継続回復は一回限りの熱気・元気追加バフを消費しない', () => {
    const baseState5 = regenerationGame();
    const initial = {
      ...baseState5,
      resourceBoosts: [
        { target: 'mental' as const, percent: 100, uses: 1 },
        { target: 'voltage' as const, percent: 100, uses: 1 },
      ],
      mental: { ...baseState5.mental, currentMental: 40 },
      voltage: { ...baseState5.voltage, currentVoltage: BigInt(40) },
    };
    const mental = applyEffect(initial, {
      kind: 'gauge-regeneration',
      gauge: 'mental',
      calculationType: 1,
      value: 10,
      intervalType: 2,
      intervalValue: 200,
      duration: { kind: 'milliseconds', value: 500 },
    });
    const voltage = applyEffect(mental, {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
      calculationType: 1,
      value: 10,
      intervalType: 2,
      intervalValue: 200,
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(voltage.mental.currentMental).toBe(50);
    expect(voltage.voltage.currentVoltage).toBe(50n);
    expect(voltage.resourceBoosts).toHaveLength(2);
  });

  it('Beat Heart間隔指定は自然発生の通知回数で回復を繰り返す', () => {
    const baseState6 = regenerationGame();
    const active = applyEffect(
      {
        ...baseState6,
        track: {
          ...baseState6.track,
          stage: { ...baseState6.track.stage, mentalDecreaseIntervalSeconds: 100 },
        },
        mental: { ...baseState6.mental, currentMental: 40 },
      },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 1,
        value: 10,
        intervalType: 2,
        intervalValue: 2,
        duration: { kind: 'sections', value: 2 },
      },
    );
    const afterFirstHeart = advanceTo(active, (2 * 60) / active.track.bpm + 1 / 60);
    expect(afterFirstHeart.mental.currentMental).toBe(50);
    expect(afterFirstHeart.regenGaugeEffects).toHaveLength(1);
    const afterSecondHeart = advanceTo(afterFirstHeart, (4 * 60) / active.track.bpm + 1 / 60);
    expect(afterSecondHeart.mental.currentMental).toBe(60);
    expect(afterSecondHeart.regenGaugeEffects[0]?.interval).toEqual({
      kind: 'beat-heart',
      count: 2,
      progress: 0,
    });
  });

  it('パート期限の回復はHeart生成で終了せずパート変更で終了する', () => {
    const active = applyEffect(regenerationGame(), {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
      calculationType: 1,
      value: 1,
      intervalType: 1,
      intervalValue: 100,
      duration: { kind: 'sections', value: 1 },
    });
    const firstHeartBeat = (2 * 60) / active.track.bpm;
    const ended = advanceTo(active, firstHeartBeat + 1 / 60);
    expect(ended.regenGaugeEffects).toHaveLength(1);
    expect(advanceSectionChange(ended, applyEffect).regenGaugeEffects).toHaveLength(0);
  });

  it('外部解除とInvocationTypeによる自動期限抑止を処理する', () => {
    const baseState7 = regenerationGame();
    const active = applyEffect(
      { ...baseState7, mental: { ...baseState7.mental, currentMental: 40 } },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 1,
        value: 10,
        intervalType: 1,
        intervalValue: 200,
        duration: { kind: 'milliseconds', value: 500 },
        invocationType: 0x388,
        deactivationKey: 'regen',
      },
    );
    expect(advanceTo(active, 0.61).regenGaugeEffects).toHaveLength(1);
    const ended = act(advanceTo(active, 0.61), {
      type: 'deactivate-gauge-regeneration',
      deactivationKey: 'regen',
    });
    expect(ended.regenGaugeEffects).toHaveLength(0);
  });

  it('計算種別1以外は追加バフ適用後も元気を回復しない', () => {
    const baseState8 = regenerationGame();
    const inactive = applyEffect(
      { ...baseState8, mental: { ...baseState8.mental, currentMental: 40 } },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 2,
        value: 10,
        intervalType: 1,
        intervalValue: 200,
        duration: { kind: 'milliseconds', value: 500 },
      },
    );
    expect(inactive.mental.currentMental).toBe(40);
    expect(inactive.regenGaugeEffects).toHaveLength(1);
  });

  it('Action11の熱気継続加算にも特殊誘発の解除制御を適用する', () => {
    const baseState9 = regenerationGame();
    const active = applyEffect(
      { ...baseState9, voltage: { ...baseState9.voltage, currentVoltage: BigInt(20) } },
      {
        kind: 'gauge-regeneration',
        gauge: 'voltage',
        calculationType: 1,
        value: 5,
        intervalType: 1,
        intervalValue: 100,
        duration: { kind: 'milliseconds', value: 500 },
        invocationType: 0x38b,
        deactivationKey: 'voltage-regen',
      },
    );
    const advanced = advanceTo(active, 0.61);
    expect(advanced.regenGaugeEffects).toHaveLength(1);
    expect(
      act(advanced, {
        type: 'deactivate-gauge-regeneration',
        deactivationKey: 'voltage-regen',
      }).regenGaugeEffects,
    ).toHaveLength(0);
  });
});

it('追加Heartは回復通知に数えず生成上限0でも自然発生の通知で回復する', () => {
  const base = regenerationGame();
  const active = applyEffect(
    {
      ...base,
      maximumMental: 100,
      mental: { ...base.mental, currentMental: 40 },
      hearts: { ...base.hearts, heartLimit: 0 },
    },
    {
      kind: 'gauge-regeneration',
      gauge: 'mental',
      calculationType: 1,
      value: 10,
      intervalType: 2,
      intervalValue: 1,
      duration: { kind: 'sections', value: 2 },
    },
  );
  const extra = addHearts(active, 5);
  expect(extra.mental.currentMental).toBe(50);
  expect(extra.regenGaugeEffects[0]?.interval).toEqual({
    kind: 'beat-heart',
    count: 1,
    progress: 0,
  });
  const natural = advanceTo(extra, (2 * 60) / active.track.bpm + 1 / 60);
  expect(natural.mental.currentMental).toBe(60);
  expect(natural.regenGaugeEffects).toHaveLength(1);
});

function regenerationGame() {
  const base = game();
  return { ...base, maximumMental: 100 };
}

it('Voltage継続回復の切り上げ後の値も変換処理へ渡す', () => {
  const initial = regenerationGame();
  const source = initial.deck[0];
  if (!source) throw new Error('回復元カードがありません。');
  const converted = applyEffect(
    initial,
    {
      kind: 'voltage-convert',
      destination: 'hearts',
      num: 10000,
      outputDuration: { kind: 'stage', value: 0 },
      convertDisabledType: 0,
      displayDuration: { kind: 'stage', value: 0 },
      disabledType: 0,
      disabledValue: 0n,
    },
    source,
  );
  const active = applyEffect(
    converted,
    {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
      calculationType: 1,
      value: 2.1,
      intervalType: 1,
      intervalValue: 1000,
      duration: { kind: 'milliseconds', value: 5000 },
    },
    source,
  );
  expect(heartCount(active)).toBe(3);
  expect(active.voltage.currentVoltage).toBe(initial.voltage.currentVoltage);
});

it('Mental継続回復はGenesis中にゲージへ渡し元気を変更しない', () => {
  const base = regenerationGame();
  const initial = activateGenesis({ ...base, mental: { ...base.mental, currentMental: 40 } }, 100);
  const active = applyEffect(initial, {
    kind: 'gauge-regeneration',
    gauge: 'mental',
    calculationType: 1,
    value: 10,
    intervalType: 1,
    intervalValue: 1000,
    duration: { kind: 'milliseconds', value: 5000 },
  });
  expect(active.mental.currentMental).toBe(40);
  expect(active.genesis.currentGauge).toBe(
    addLiveGenesisGauge(initial.genesis, { actionType: 0, gaugeType: 2, effectValue: 10 })
      .currentGauge,
  );
  expect(active.genesis.currentGauge).toBeGreaterThan(initial.genesis.currentGauge);
});
