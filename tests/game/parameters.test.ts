import { describe, expect, it } from 'vite-plus/test';
import {
  applyGroupedBuffs,
  applyOrderedBuffs,
  applyPercentBuffs,
  parameterValue,
  type ParameterBuff,
} from '@akaakuhub/suku-sute-core/game/parameters/buffs';
import {
  appealParameter,
  cardParameters,
  type StyleParameters,
} from '@akaakuhub/suku-sute-core/game/parameters/cardParameters';
import {
  changeMaximum,
  energyMaximum,
  staminaMaximum,
} from '@akaakuhub/suku-sute-core/game/parameters/maximum';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { game } from './support/game';

const buffs: readonly ParameterBuff[] = [
  { kind: 'multiply', group: 'skill', value: 1.5 },
  { kind: 'add', group: 'skill', value: 10 },
  { kind: 'multiply', group: 'skill', value: 1.5 },
  { kind: 'multiply', group: 'mastery', value: 2 },
];

describe('原実装のパラメータ計算', () => {
  it('加算を先に適用し、同じグループの倍率差分を足し、別グループは乗算する', () => {
    expect(applyGroupedBuffs(100, buffs)).toBe(440);
  });
  it('順序付きの値は登録順で加算・乗算・固定を実行する', () => {
    expect(applyOrderedBuffs(100, buffs)).toBe(480);
    expect(applyOrderedBuffs(100, [...buffs, { kind: 'fixed', group: 'section', value: 7 }])).toBe(
      7,
    );
  });
  it('倍率合計の下限を−100%にして負数を作らない', () => {
    expect(applyGroupedBuffs(100, [{ kind: 'multiply', group: 'skill', value: -1 }])).toBe(0);
    expect(applyPercentBuffs(100, [-70, -50])).toBe(0);
  });
  it('基礎値と最終値に別々の制限を適用し、制限前の値も返す', () => {
    expect(
      parameterValue({
        base: 200,
        minimumBase: 0,
        maximumBase: 100,
        minimum: 0,
        maximum: 300,
        buffs,
      }),
    ).toEqual({ value: 300, unclamped: 440 });
  });
  it('未対応のバフ種別を別の計算に置き換えない', () => {
    expect(() => applyGroupedBuffs(100, [{ kind: 'fixed', group: 'skill', value: 1 }])).toThrow();
    expect(() =>
      applyOrderedBuffs(100, [{ kind: 'multiply-percent', group: 'skill', value: 1 }]),
    ).toThrow();
  });
  it('サイドスタイルは10%を加算し、最大アピールの同値はcoolを選ぶ', () => {
    const style: StyleParameters = {
      appeal: { smile: 100, pure: 100, cool: 100 },
      mental: 100,
      beatPoint: 10,
    };
    expect(cardParameters(style, [style, style])).toEqual({
      appeal: { smile: 120, pure: 120, cool: 120 },
      mental: 120,
      beatPoint: 12,
      highestAppeal: 3,
    });
  });
  it('アピールはfloatの各演算で丸め、シミュレーション値も保持する', () => {
    const simulation = Math.fround(Math.fround(123 + 4) * 1.5);
    expect(appealParameter(123, 4, 1.5, 90)).toEqual({
      simulation,
      value: Math.fround(Math.fround(simulation / 90) / 1000),
    });
  });
  it('上限の固定・乗算・加算も登録順に適用する', () => {
    expect(
      changeMaximum(10, [
        { calculation: 'add', value: 5 },
        { calculation: 'multiply', value: 10000 },
        { calculation: 'fixed', value: 7 },
        { calculation: 'add', value: 2 },
      ]),
    ).toBe(9);
  });
  it('上限の整数加算を参照実装のint32範囲へ戻す', () => {
    expect(changeMaximum(2_147_483_647, [{ calculation: 'add', value: 1 }])).toBe(-2_147_483_648);
  });
  it('エナジーの絶対上限100と元気の基礎値10倍を守る', () => {
    expect(energyMaximum(20, [{ calculation: 'add', value: 200 }])).toBe(100);
    expect(staminaMaximum(100, [{ calculation: 'add', value: 2000 }])).toBe(1000);
    expect(staminaMaximum(100, [{ calculation: 'fixed', value: 0 }])).toBe(1);
    expect(staminaMaximum(100, [], 2)).toBe(100);
    expect(applyEffect(game(), { kind: 'energy-limit', amount: 200 }).maxEnergy).toBe(100);
  });
});
