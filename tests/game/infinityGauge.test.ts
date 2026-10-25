import { describe, expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import { act } from '../../src/domain/game/actions';
import { changeResource } from '../../src/domain/game/resources';
import { voltageThreshold } from '../../src/domain/game/live/voltageLevel';
import { advanceTo } from '../../src/domain/game/simulation';
import { activateBloom, finishBloom } from '../../src/domain/game/bloom';
import { game } from './support/game';

describe('無限ゲージ', () => {
  it('期限中はAPを消費できず、AP無限の解除後も現在値を維持する', () => {
    const initial = { ...game(), energy: 2 };
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'ap',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(active.energy).toBe(active.maxEnergy);
    const during = advanceTo(active, 0.25);
    expect(during.energy).toBe(during.maxEnergy);
    const ended = advanceTo(during, 0.5 + 1 / 60);
    expect(ended.gaugeInfinities).toHaveLength(0);
    expect(ended.energy).toBe(ended.maxEnergy);
  });

  it('重複する熱気無限のうち最後の期限でレベル10へ戻す', () => {
    const initial = game();
    const first = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const second = applyEffect(first, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 1000 },
    });
    const overlap = advanceTo(second, 0.5 + 1 / 60);
    expect(overlap.gaugeInfinities).toHaveLength(1);
    expect(overlap.excitement).toBe(second.excitement);
    const ended = advanceTo(overlap, 1 + 1 / 60);
    expect(ended.gaugeInfinities).toHaveLength(0);
    expect(ended.excitement).toBe(voltageThreshold(10));
  });

  it('Action39は無限開始時の熱気差をMasteryへ渡し、報酬を変換する', () => {
    const initial = game();
    const conversion = {
      id: 1,
      destination: 'love' as const,
      num: 10_000,
      outputDuration: { kind: 'milliseconds' as const, value: 1000 },
      disabledOnConvertCount: null,
      conversions: 0,
      expireOnHeartCollect: false,
      remainingSeconds: null,
      remainingSections: null,
      deactivationKey: null,
    };
    const state = {
      ...initial,
      track: { ...initial.track, masteryVoltageBonus: { demand: 1, gain: 3 } },
      voltageConversions: [conversion],
    };
    const active = applyEffect(state, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'stage', value: 0 },
    });
    expect(active.masteryVoltageProgress).toBe(0);
    expect(active.voltageConversions[0]?.conversions).toBe(1);
    expect(active.temporaryScoreBoosts.at(-1)?.percent).toBe(3);
  });

  it('元気無限の開始と最終解除で元気タイマーを0へ戻す', () => {
    const initial = { ...game(), stamina: 42, mentalTimerSeconds: 0.4 };
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(active.stamina).toBe(100);
    expect(active.mentalTimerSeconds).toBe(0);
    const ended = advanceTo({ ...active, mentalTimerSeconds: 0.4 }, 0.5);
    expect(ended.stamina).toBe(100);
    expect(ended.mentalTimerSeconds).toBe(0);
  });

  it('元気上限の拡張値を元気無限開始時の誘発ハート計算へ渡す', () => {
    const initial = {
      ...game(),
      maximumMental: 150,
      hearts: { ...game().hearts, heartLimit: 500 },
    };
    const inducing = applyEffect(initial, {
      kind: 'mental-heart-induce',
      num: 10_000,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'milliseconds', value: 5_000 },
      disabledType: 0,
      disabledValue: 0,
    });
    const active = applyEffect(inducing, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const generated =
      active.hearts.stageHearts.length +
      active.hearts.hiddenHeartBatches.reduce((sum, batch) => sum + batch.count, 0);
    expect(generated).toBe(150);
  });

  it('Action23の詳細値をC#のint32へ変換する', () => {
    const active = applyEffect(game(), {
      kind: 'mental-heart-induce',
      num: 2_147_483_648,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'milliseconds', value: 5_000 },
      disabledType: 0,
      disabledValue: 0,
    });
    expect(active.mentalHeartInducers[0]?.precomputedNum).toBe(-2_147_483_648);
  });

  it('期限抑止された効果はDeactivatorまで残り、解除時に最後のゲージ値へ戻す', () => {
    const initial = { ...game(), excitement: 100 };
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 500 },
      invocationType: 0x388,
      deactivationKey: 'voltage-infinity',
    });
    expect(advanceTo(active, 1).gaugeInfinities).toHaveLength(1);
    const ended = act(active, {
      type: 'deactivate-infinity-gauge',
      deactivationKey: 'voltage-infinity',
    });
    expect(ended.gaugeInfinities).toHaveLength(0);
    expect(ended.excitement).toBe(voltageThreshold(10));
  });

  it('Genesis中に開始した無限ゲージの時間期限を保持し、終了後に無限状態へ移す', () => {
    const initial = activateBloom(game('bloom'), 1);
    const active = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'ap',
      duration: { kind: 'milliseconds', value: 1000 },
    });
    expect(active.gaugeInfinities[0]?.suspended).toBe(true);
    expect(active.bloom?.progress).toBe((initial.bloom?.progress ?? 0n) + 500n);
    const finished = finishBloom(active);
    expect(finished.gaugeInfinities[0]?.suspended).toBe(false);
    expect(finished.energy).toBe(finished.maxEnergy);
    expect(changeResource(finished, 'energy', -1n).energy).toBe(finished.energy);
  });

  it('開花中は500のGenesisゲージを加算し、期限付き無限状態を保留する', () => {
    const initial = activateBloom(game('bloom'), 1);
    const next = applyEffect(initial, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    expect(next.bloom?.progress).toBe((initial.bloom?.progress ?? 0n) + 500n);
    expect(next.gaugeInfinities[0]?.suspended).toBe(true);
  });

  it('Genesis中に開始した熱気と元気の無限状態を終了時に反映する', () => {
    const base = game('bloom');
    const initial = {
      ...base,
      maximumMental: 150,
      hearts: { ...base.hearts, heartLimit: 500 },
    };
    const inducing = applyEffect(initial, {
      kind: 'mental-heart-induce',
      num: 10_000,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'milliseconds', value: 5_000 },
      disabledType: 0,
      disabledValue: 0,
    });
    const blooming = activateBloom(inducing, 1);
    const voltage = applyEffect(blooming, {
      kind: 'infinity-gauge',
      gauge: 'voltage',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const mental = applyEffect(voltage, {
      kind: 'infinity-gauge',
      gauge: 'mental',
      duration: { kind: 'milliseconds', value: 500 },
    });
    const finished = finishBloom(mental);
    const generated =
      finished.hearts.stageHearts.length +
      finished.hearts.hiddenHeartBatches.reduce((sum, batch) => sum + batch.count, 0);
    expect(finished.excitement).toBe(voltageThreshold(finished.maximumVoltageLevel));
    expect(finished.stamina).toBe(150);
    expect(generated).toBe(150);
  });
});
