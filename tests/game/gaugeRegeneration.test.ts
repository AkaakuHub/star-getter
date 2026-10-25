import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

describe('ゲージの継続回復', () => {
  it('元気は発動時に回復し、周期回復後に期限切れとなる', () => {
    const initial = { ...game(), stamina: 40 };
    const active = applyEffect(initial, {
      kind: 'gauge-regeneration',
      gauge: 'mental',
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
      amount: 10,
      intervalType: 2,
      intervalMilliseconds: 200,
      duration: { kind: 'milliseconds', value: 500 },
    });
    const voltage = applyEffect(mental, {
      kind: 'gauge-regeneration',
      gauge: 'voltage',
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
      amount: 1,
      intervalType: 1,
      intervalMilliseconds: 100,
      duration: { kind: 'sections', value: 1 },
    });
    const firstHeartBeat = (2 * 60) / active.track.bpm;
    const ended = advanceTo(active, firstHeartBeat + 1 / 60);
    expect(ended.gaugeRegenerations).toHaveLength(0);
  });
});
