import { expect, it } from 'vite-plus/test';
import { createModeChangeInduceEffect } from '../../src/domain/game/actionTypeEffects/modeChangeInduce';

it('ActionType45はlongのmode IDをint32化し、閾値・子効果を保持する', () => {
  const effects = [{ kind: 'voltage-set' as const, amount: 20 }];
  expect(
    createModeChangeInduceEffect({
      skillEffectId: 45n,
      thresholds: [(1n << 53n) + 1n],
      effects,
      details: [
        { id: 1n, detailType: 'MODE_CHANGE_INDUCE_TARGET_MODE_ID', value: 4_294_967_298n },
        { id: 2n, detailType: 'MODE_CHANGE_INDUCE_BUFF_NUM', value: (1n << 53n) + 3n },
      ],
    }),
  ).toEqual({
    kind: 'mode-reaction',
    modeId: 2,
    thresholds: [(1n << 53n) + 1n],
    effects,
    buffNum: (1n << 53n) + 3n,
  });
});

it('ActionType45は回数詳細または子効果がない場合に登録しない構造を作る', () => {
  expect(
    createModeChangeInduceEffect({
      skillEffectId: 45n,
      details: [],
      thresholds: null,
      effects: [],
    }),
  ).toEqual({ kind: 'mode-reaction', modeId: 0, thresholds: [], effects: [], buffNum: 0n });
});
