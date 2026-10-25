import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo } from '../../src/domain/game/simulation';
import { act } from '../../src/domain/game/actions';
import { game } from './support/game';

describe('ゲージの継続回復', () => {
  it('元気は発動時に回復し、周期回復後に期限切れとなる', () => {
    const initial = { ...game(), stamina: 40 };
    const active = applyEffect(initial, {
      kind: 'gauge-regeneration',
      gauge: 'mental',
      calculationType: 1,
      amount: 10,
      intervalType: 1,
      intervalMilliseconds: 200,
      duration: { kind: 'milliseconds', value: 600 },
    });
    expect(active.stamina).toBe(50);
    const afterDuration = advanceTo(active, 0.61);
    expect(afterDuration.stamina).toBe(80);
    expect(afterDuration.gaugeRegenerations).toHaveLength(0);
  });

  it('熱気は発動時に加算し、期限中の周期加算を上限で制限する', () => {
    const initial = { ...game(), excitement: 654_999_999 };
    const active = applyEffect(initial, {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
      calculationType: 1,
      amount: 10,
      intervalType: 1,
      intervalMilliseconds: 200,
      duration: { kind: 'milliseconds', value: 600 },
    });
    expect(active.excitement).toBe(655_000_001);
    expect(advanceTo(active, 0.61).excitement).toBe(655_000_001);
  });

  it('継続回復は一回限りの熱気・元気追加バフを消費しない', () => {
    const initial = {
      ...game(),
      stamina: 40,
      excitement: 40,
      resourceBoosts: [
        { target: 'stamina' as const, percent: 100, uses: 1 },
        { target: 'excitement' as const, percent: 100, uses: 1 },
      ],
    };
    const mental = applyEffect(initial, {
      kind: 'gauge-regeneration',
      gauge: 'mental',
      calculationType: 1,
      amount: 10,
      intervalType: 2,
      intervalMilliseconds: 200,
      duration: { kind: 'milliseconds', value: 500 },
    });
    const voltage = applyEffect(mental, {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
      calculationType: 1,
      amount: 10,
      intervalType: 2,
      intervalMilliseconds: 200,
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(voltage.stamina).toBe(50);
    expect(voltage.excitement).toBe(50);
    expect(voltage.resourceBoosts).toHaveLength(2);
  });

  it('ハート間隔指定は回復を繰り返さず、表示期限のハートイベントで終了する', () => {
    const active = applyEffect(
      { ...game(), stamina: 40 },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 1,
        amount: 10,
        intervalType: 2,
        intervalMilliseconds: 200,
        duration: { kind: 'sections', value: 2 },
      },
    );
    const afterFirstHeart = advanceTo(active, (2 * 60) / active.track.bpm + 1 / 60);
    expect(afterFirstHeart.stamina).toBe(50);
    expect(afterFirstHeart.gaugeRegenerations).toHaveLength(1);
  });

  it('パート期限の回復をハート生成イベントで終了する', () => {
    const active = applyEffect(game(), {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
      calculationType: 1,
      amount: 1,
      intervalType: 1,
      intervalMilliseconds: 100,
      duration: { kind: 'sections', value: 1 },
    });
    const firstHeartBeat = (2 * 60) / active.track.bpm;
    const ended = advanceTo(active, firstHeartBeat + 1 / 60);
    expect(ended.gaugeRegenerations).toHaveLength(0);
  });

  it('外部解除とInvocationTypeによる自動期限抑止を処理する', () => {
    const active = applyEffect(
      { ...game(), stamina: 40 },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 1,
        amount: 10,
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
    const inactive = applyEffect(
      { ...game(), stamina: 40 },
      {
        kind: 'gauge-regeneration',
        gauge: 'mental',
        calculationType: 2,
        amount: 10,
        intervalType: 1,
        intervalMilliseconds: 200,
        duration: { kind: 'milliseconds', value: 500 },
      },
    );
    expect(inactive.stamina).toBe(40);
    expect(inactive.gaugeRegenerations).toHaveLength(1);
  });

  it('Action11の熱気継続加算にも特殊誘発の解除制御を適用する', () => {
    const active = applyEffect(
      { ...game(), excitement: 20 },
      {
        kind: 'gauge-regeneration',
        gauge: 'voltage',
        calculationType: 1,
        amount: 5,
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
