import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { game } from './support/game';

describe('ゲージの継続回復', () => {
  it('最大元気に対する割合を各回の元気回復量へ変換する', () => {
    const baseState = game();
    const active = applyEffect(
      { ...baseState, maximumMental: 100, mental: { ...baseState.mental, currentMental: 40 } },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 1,
        amount: 0.05,
        amountBasis: 'maximum-gauge',
        intervalType: 1,
        intervalMilliseconds: 200,
        duration: { kind: 'milliseconds', value: 600 },
      },
    );
    expect(active.mental.currentMental).toBe(45);
    expect(advanceTo(active, 0.21).mental.currentMental).toBe(50);
  });

  it('Action11は汎用スキル増幅と切り上げを使わず周期ごとに熱気を加算する', () => {
    const baseState2 = game();
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
        amount: 10.5,
        amountBasis: 'skill-fixed',
        intervalType: 1,
        intervalMilliseconds: 200,
        duration: { kind: 'milliseconds', value: 600 },
      },
    );
    expect(active.voltage.currentVoltage).toBe(510n);
    expect(advanceTo(active, 0.21).voltage.currentVoltage).toBe(520n);
  });

  it('元気は発動時に回復し、周期回復後に期限切れとなる', () => {
    const baseState3 = game();
    const initial = { ...baseState3, mental: { ...baseState3.mental, currentMental: 40 } };
    const active = applyEffect(initial, {
      kind: 'gauge-regeneration',
      gauge: 'mental',
      calculationType: 1,
      amount: 10,
      amountBasis: 'fixed',
      intervalType: 1,
      intervalMilliseconds: 200,
      duration: { kind: 'milliseconds', value: 600 },
    });
    expect(active.mental.currentMental).toBe(50);
    const afterDuration = advanceTo(active, 0.61);
    expect(afterDuration.mental.currentMental).toBe(80);
    expect(afterDuration.gaugeRegenerations).toHaveLength(0);
  });

  it('熱気は発動時と期限中の周期ごとに加算し、レベル上限でもポイントを保持する', () => {
    const baseState4 = game();
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
      amount: 10,
      amountBasis: 'fixed',
      intervalType: 1,
      intervalMilliseconds: 200,
      duration: { kind: 'milliseconds', value: 600 },
    });
    expect(active.voltage.currentVoltage).toBe(655_000_009n);
    expect(advanceTo(active, 0.61).voltage.currentVoltage).toBe(655_000_039n);
    expect(advanceTo(active, 0.61).gaugeRegenerations).toHaveLength(0);
  });

  it('継続回復は一回限りの熱気・元気追加バフを消費しない', () => {
    const baseState5 = game();
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
      amount: 10,
      amountBasis: 'fixed',
      intervalType: 2,
      intervalMilliseconds: 200,
      duration: { kind: 'milliseconds', value: 500 },
    });
    const voltage = applyEffect(mental, {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
      calculationType: 1,
      amount: 10,
      amountBasis: 'fixed',
      intervalType: 2,
      intervalMilliseconds: 200,
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(voltage.mental.currentMental).toBe(50);
    expect(voltage.voltage.currentVoltage).toBe(50n);
    expect(voltage.resourceBoosts).toHaveLength(2);
  });

  it('ハート間隔指定は回復を繰り返さず、表示期限のハートイベントで終了する', () => {
    const baseState6 = game();
    const active = applyEffect(
      { ...baseState6, mental: { ...baseState6.mental, currentMental: 40 } },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 1,
        amount: 10,
        amountBasis: 'fixed',
        intervalType: 2,
        intervalMilliseconds: 200,
        duration: { kind: 'sections', value: 2 },
      },
    );
    const afterFirstHeart = advanceTo(active, (2 * 60) / active.track.bpm + 1 / 60);
    expect(afterFirstHeart.mental.currentMental).toBe(50);
    expect(afterFirstHeart.gaugeRegenerations).toHaveLength(1);
  });

  it('パート期限の回復をハート生成イベントで終了する', () => {
    const active = applyEffect(game(), {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
      calculationType: 1,
      amount: 1,
      amountBasis: 'fixed',
      intervalType: 1,
      intervalMilliseconds: 100,
      duration: { kind: 'sections', value: 1 },
    });
    const firstHeartBeat = (2 * 60) / active.track.bpm;
    const ended = advanceTo(active, firstHeartBeat + 1 / 60);
    expect(ended.gaugeRegenerations).toHaveLength(0);
  });

  it('外部解除とInvocationTypeによる自動期限抑止を処理する', () => {
    const baseState7 = game();
    const active = applyEffect(
      { ...baseState7, mental: { ...baseState7.mental, currentMental: 40 } },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 1,
        amount: 10,
        amountBasis: 'fixed',
        intervalType: 1,
        intervalMilliseconds: 200,
        duration: { kind: 'milliseconds', value: 500 },
        invocationType: 0x388,
        deactivationKey: 'regen',
      },
    );
    expect(advanceTo(active, 0.61).gaugeRegenerations).toHaveLength(1);
    const ended = act(advanceTo(active, 0.61), {
      type: 'deactivate-gauge-regeneration',
      deactivationKey: 'regen',
    });
    expect(ended.gaugeRegenerations).toHaveLength(0);
  });

  it('計算種別1以外は追加バフ適用後も元気を回復しない', () => {
    const baseState8 = game();
    const inactive = applyEffect(
      { ...baseState8, mental: { ...baseState8.mental, currentMental: 40 } },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 2,
        amount: 10,
        amountBasis: 'fixed',
        intervalType: 1,
        intervalMilliseconds: 200,
        duration: { kind: 'milliseconds', value: 500 },
      },
    );
    expect(inactive.mental.currentMental).toBe(40);
    expect(inactive.gaugeRegenerations).toHaveLength(1);
  });

  it('Action11の熱気継続加算にも特殊誘発の解除制御を適用する', () => {
    const baseState9 = game();
    const active = applyEffect(
      { ...baseState9, voltage: { ...baseState9.voltage, currentVoltage: BigInt(20) } },
      {
        kind: 'gauge-regeneration',
        gauge: 'voltage',
        calculationType: 1,
        amount: 5,
        amountBasis: 'fixed',
        intervalType: 1,
        intervalMilliseconds: 100,
        duration: { kind: 'milliseconds', value: 500 },
        invocationType: 0x38b,
        deactivationKey: 'voltage-regen',
      },
    );
    const advanced = advanceTo(active, 0.61);
    expect(advanced.gaugeRegenerations).toHaveLength(1);
    expect(
      act(advanced, {
        type: 'deactivate-gauge-regeneration',
        deactivationKey: 'voltage-regen',
      }).gaugeRegenerations,
    ).toHaveLength(0);
  });
});
