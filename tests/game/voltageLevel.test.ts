import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import {
  voltageLevel,
  voltageProgress,
  voltageThreshold,
} from '../../src/domain/game/live/voltageLevel';
import { act } from '../../src/domain/game/actions';
import { game } from './support/game';

it('通常上限1000を追加の共鳴で1500へ増やし、800万Pt刻みの閾値を使う', () => {
  const initial = { ...game(), energy: 3 };
  expect(initial.maximumVoltageLevel).toBe(1000);
  const extended = act(initial, { type: 'special', cardId: 'frost-pulse' });
  expect(extended.maximumVoltageLevel).toBe(1500);
  expect(voltageThreshold(1000)).toBe(655_000_001);
  expect(voltageThreshold(1001)).toBe(663_000_001);
  expect(voltageThreshold(1500)).toBe(4_655_000_001);
  const gained = applyEffect(
    { ...extended, hand: [], excitement: 655_000_001 },
    { kind: 'excitement', amount: 8_000_000 },
  );
  expect(voltageLevel(gained.excitement, gained.maximumVoltageLevel)).toBe(1001);
  expect(voltageLevel(gained.excitement, initial.maximumVoltageLevel)).toBe(1000);
  expect(voltageProgress(659_000_001, extended.maximumVoltageLevel)).toBe(50);
});

it('固定値のFloat32丸め後は999段階で、自然増加の1Ptで1000段階へ達する', () => {
  const state = applyEffect(game(), { kind: 'voltage-set', amount: 655_000_001 });
  expect(voltageLevel(state.excitement, state.maximumVoltageLevel)).toBe(999);
  const gained = applyEffect({ ...state, hand: [] }, { kind: 'excitement', amount: 1 });
  expect(voltageLevel(gained.excitement, gained.maximumVoltageLevel)).toBe(1000);
});

it('ActionType37は変換やActionType52を使わず、浮動小数点丸め後の指定値へ直接設定する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'voltage-convert',
      destination: 'hearts',
      num: 10000,
      outputDuration: { kind: 'stage', value: 0 },
      convertDisabledType: 0,
      displayDuration: { kind: 'stage', value: 0 },
      disabledType: 0,
      disabledValue: 0,
    },
    source,
  );
  const set = applyEffect(active, { kind: 'voltage-set', amount: 655_000_001 });
  expect(set.excitement).toBe(655_000_000);
  expect(set.voltageConversions).toHaveLength(1);
  expect(set.hearts).toEqual(active.hearts);
});
