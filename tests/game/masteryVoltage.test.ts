import { expect, it } from 'vite-plus/test';
import { changeResource } from '../../src/domain/game/resources';
import { game } from './support/game';

it('ActionType22のマスタリー電圧ボーナスは正の加算を蓄積し、閾値一致時に付与する', () => {
  const initial = game();
  const state = {
    ...initial,
    excitement: 10,
    track: {
      ...initial.track,
      masteryVoltageBonus: { demand: 3, gain: 5 },
    },
  };
  const first = changeResource(state, 'excitement', 2n);
  expect(first.excitement).toBe(12);
  expect(first.masteryVoltageProgress).toBe(2);

  const reached = changeResource(first, 'excitement', 1n);
  expect(reached.excitement).toBe(18);
  expect(reached.masteryVoltageProgress).toBe(0);
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
  const changed = changeResource(state, 'excitement', -1n);
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
  const changed = changeResource(state, 'excitement', 4_294_967_297n);
  expect(changed.excitement).toBe(6);
  expect(changed.masteryVoltageProgress).toBe(0);
});
