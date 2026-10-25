import { describe, expect, it } from 'vite-plus/test';
import { advanceAutomaticGauges } from '../../src/domain/game/automaticGauges';
import { applyEffect } from '../../src/domain/game/effects';
import { changeResource } from '../../src/domain/game/resources';
import { mentalDecreaseInterval } from '../../src/domain/game/live/mentalBarriers';
import { advanceTo } from '../../src/domain/game/simulation';
import { game } from './support/game';

describe('元気バリア', () => {
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
        attenuation: 2,
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
