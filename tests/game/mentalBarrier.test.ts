import { describe, expect, it } from 'vite-plus/test';
import { advanceAutomaticGauges } from '../../src/domain/game/automaticGauges';
import { applyEffect } from '../../src/domain/game/effects';
import { changeResource } from '../../src/domain/game/resources';
import {
  addMentalBarrier,
  mentalDecreaseInterval,
} from '../../src/domain/game/live/mentalBarriers';
import { registerProxySkill } from '../../src/domain/game/effects/proxySkill';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

describe('元気バリア', () => {
  it('耐久割合を最大元気へ掛けて整数化する', () => {
    const active = applyEffect(
      { ...game(), maximumMental: 80 },
      {
        kind: 'mental-barrier',
        barrier: 'endurance',
        enduranceType: 'ratio',
        endurance: 25,
        attenuation: 0,
        duration: { kind: 'stage' },
      },
    );
    expect(active.mentalBarriers[0]?.endurance).toBe(20);
  });

  it('有限耐久が0になる時はC#同様にバリアを登録しない', () => {
    const active = applyEffect(game(), {
      kind: 'mental-barrier',
      barrier: 'endurance',
      enduranceType: 'fixed',
      endurance: 0,
      attenuation: 0,
      duration: { kind: 'stage' },
    });
    expect(active.mentalBarriers).toHaveLength(0);
  });

  it('ActionType7のProxyへ整数耐久値を渡し、吸収時にバリアを登録しない', () => {
    const initial = game();
    const source = initial.deck[0];
    if (!source) throw new Error('Proxy発動元カードがありません。');
    const active = registerProxySkill(
      initial,
      {
        kind: 'proxy-skill',
        absorbLimit: 1,
        periodType: 1,
        periodParam: 3000,
        induceTiming: 1,
        induceCondition: 1,
        inducePowerType: 1,
        inducePowerParam: 0,
        targets: [{ actionType: 7, targetAmount: 5 }],
        effects: [],
      },
      source,
    );
    const barrier = {
      kind: 'mental-barrier',
      barrier: 'endurance',
      enduranceType: 'fixed',
      endurance: 0,
      attenuation: 0,
      duration: { kind: 'stage' },
    } as const;
    const first = addMentalBarrier(active, barrier, 5.8, 0);
    expect(first.mentalBarriers).toHaveLength(0);
    expect(first.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(5n);
    const afterLimit = addMentalBarrier(first, barrier, 3, 0);
    expect(afterLimit.mentalBarriers).toHaveLength(0);
    expect(afterLimit.proxyAbsorptions[0]?.effects[0]?.totalAmount).toBe(5n);
  });

  it('耐久型は指定量まで元気減少を吸収し、超過分を通す', () => {
    const active = applyEffect(game(), {
      kind: 'mental-barrier',
      barrier: 'endurance',
      enduranceType: 'fixed',
      endurance: 2,
      attenuation: 1,
      duration: { kind: 'stage' },
    });
    const damaged = changeResource(active, 'stamina', -3n);
    expect(damaged.stamina).toBe(99);
    expect(damaged.mentalBarriers[0]?.currentEndurance).toBe(2);
  });

  it('InvocationType 0x388では指定時間が過ぎてもバリアを維持する', () => {
    const active = applyEffect(game(), {
      kind: 'mental-barrier',
      barrier: 'endurance',
      enduranceType: 'fixed',
      endurance: 10,
      attenuation: 1,
      duration: { kind: 'milliseconds', value: 100 },
      invocationType: 0x388,
    });
    expect(advanceTo(active, 1).mentalBarriers).toHaveLength(1);
  });

  it('耐久無限型はスキルと自然減少を吸収する', () => {
    const active = applyEffect(game(), {
      kind: 'mental-barrier',
      barrier: 'endurance',
      enduranceType: 'infinite',
      endurance: 0,
      attenuation: 1,
      duration: { kind: 'stage' },
    });
    expect(changeResource(active, 'stamina', -5n).stamina).toBe(100);
    expect(advanceAutomaticGauges(active, 1.2).stamina).toBe(100);
  });

  it('自然減少は有限耐久を1ずつ使い切った後に元気へ通す', () => {
    const active = applyEffect(game(), {
      kind: 'mental-barrier',
      barrier: 'endurance',
      enduranceType: 'fixed',
      endurance: 1,
      attenuation: 1,
      duration: { kind: 'stage' },
    });
    const after = advanceAutomaticGauges(
      active,
      active.track.stage.mentalDecreaseIntervalSeconds * 2 + 0.1,
    );
    expect(after.stamina).toBe(99);
    expect(after.mentalBarriers[0]?.currentEndurance).toBe(1);
  });

  it('減衰型はスキル減少量を減らし、自然減少間隔と途中時間を倍率で伸ばす', () => {
    const active = applyEffect(
      { ...game(), mentalTimerSeconds: 0.3 },
      {
        kind: 'mental-barrier',
        barrier: 'attenuation',
        enduranceType: 'infinite',
        endurance: 0,
        attenuation: 200,
        duration: { kind: 'stage' },
      },
    );
    expect(active.mentalTimerSeconds).toBeCloseTo(
      (mentalDecreaseInterval(active, active.track.stage.mentalDecreaseIntervalSeconds) /
        active.track.stage.mentalDecreaseIntervalSeconds) *
        0.3,
      5,
    );
    expect(changeResource(active, 'stamina', -3n).stamina).toBe(99);
  });

  it('パート期限でバリアを解除する', () => {
    const initial = game();
    const active = applyEffect(initial, {
      kind: 'mental-barrier',
      barrier: 'endurance',
      enduranceType: 'infinite',
      endurance: 0,
      attenuation: 1,
      duration: { kind: 'sections', value: 1 },
    });
    const section = active.track.sections[1];
    if (!section) throw new Error('次のパートがありません。');
    const ended = advanceTo(active, (section.startBeat * 60) / active.track.bpm + 1 / 60);
    expect(ended.mentalBarriers).toHaveLength(0);
  });
});
