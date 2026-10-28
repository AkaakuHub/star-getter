import { expect, it } from 'vite-plus/test';
import { changeResource } from '@akaakuhub/suku-sute-core/game/resources';
import { game } from './support/game';

it('ActionType22のマスタリー電圧ボーナスは正の加算を蓄積し、閾値以上で付与する', () => {
  const initial = game();
  const state = {
    ...initial,
    currentVoltage: 10,
    track: {
      ...initial.track,
      masteryVoltageBonus: { demand: 3, gain: 5 },
    },
  };
  const first = changeResource(state, 'voltage', 2n);
  expect(first.currentVoltage).toBe(12);
  expect(first.masteryVoltageProgress).toBe(2);

  const reached = changeResource(first, 'voltage', 1n);
  expect(reached.currentVoltage).toBe(18);
  expect(reached.masteryVoltageProgress).toBe(0);
});

it('ActionType22のマスタリー電圧ボーナスは閾値を超えても1回付与する', () => {
  const initial = game();
  const state = {
    ...initial,
    currentVoltage: 10,
    masteryVoltageProgress: 2,
    track: {
      ...initial.track,
      masteryVoltageBonus: { demand: 3, gain: 5 },
    },
  };
  const changed = changeResource(state, 'voltage', 2n);
  expect(changed.currentVoltage).toBe(17);
  expect(changed.masteryVoltageProgress).toBe(0);
});

it('ActionType22のマスタリー電圧ボーナスは負の加算で進行しない', () => {
  const initial = game();
  const state = {
    ...initial,
    track: {
      ...initial.track,
      masteryVoltageBonus: { demand: 3, gain: 5 },
    },
  };
  const changed = changeResource(state, 'voltage', -1n);
  expect(changed.masteryVoltageProgress).toBe(0);
});

it('電圧計のint32変換後の値をマスタリーへ加算する', () => {
  const initial = game();
  const state = {
    ...initial,
    track: {
      ...initial.track,
      masteryVoltageBonus: { demand: 1, gain: 5 },
    },
  };
  const changed = changeResource(state, 'voltage', 4_294_967_297n);
  expect(changed.currentVoltage).toBe(6);
  expect(changed.masteryVoltageProgress).toBe(0);
});
