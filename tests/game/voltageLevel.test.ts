import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import {
  voltageLevel,
  voltageProgress,
  voltageThreshold,
} from '@akaakuhub/suku-sute-core/game/live/voltageLevel';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { game } from './support/game';

it('通常上限1000を追加の共鳴で1500へ増やし、800万Pt刻みの閾値を使う', () => {
  const initial = { ...game(), currentAp: 3 };
  expect(initial.maximumVoltageLevel).toBe(1000);
  const extended = act(initial, { type: 'special', cardId: 'frost-pulse' });
  expect(extended.maximumVoltageLevel).toBe(1500);
  expect(voltageThreshold(1000)).toBe(655_000_001);
  expect(voltageThreshold(1001)).toBe(663_000_001);
  expect(voltageThreshold(1500)).toBe(4_655_000_001);
  const gained = applyEffect(
    { ...extended, hand: [], currentVoltage: 655_000_001 },
    { kind: 'voltage', amount: 8_000_000 },
  );
  expect(voltageLevel(gained.currentVoltage, gained.maximumVoltageLevel)).toBe(1001);
  expect(voltageLevel(gained.currentVoltage, initial.maximumVoltageLevel)).toBe(1000);
  expect(voltageProgress(659_000_001, extended.maximumVoltageLevel)).toBe(50);
});

it('固定値のFloat32丸め後は999段階で、自然増加の1Ptで1000段階へ達する', () => {
  const state = applyEffect(game(), { kind: 'voltage-set', amount: 655_000_001 });
  expect(voltageLevel(state.currentVoltage, state.maximumVoltageLevel)).toBe(999);
  const gained = applyEffect({ ...state, hand: [] }, { kind: 'voltage', amount: 1 });
  expect(voltageLevel(gained.currentVoltage, gained.maximumVoltageLevel)).toBe(1000);
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
      disabledValue: 0n,
    },
    source,
  );
  const set = applyEffect(active, { kind: 'voltage-set', amount: 655_000_001 });
  expect(set.currentVoltage).toBe(655_000_000);
  expect(set.voltageConversions).toHaveLength(1);
  expect(set.hearts).toEqual(active.hearts);
});

it('ActionType37は開花中に熱気の差分を参照実装の専用ゲージ式で加算する', () => {
  const state = {
    ...game('bloom'),
    currentVoltage: 100,
    bloom: {
      progress: 10n,
      strength: 3.5,
      rollback: { currentAp: 0, currentMental: 0, currentVoltage: 100 },
    },
  };
  const target = voltageThreshold(10);
  const set = applyEffect(state, { kind: 'voltage-set', amount: target });
  expect(set.currentVoltage).toBe(state.currentVoltage);
  expect(set.bloom?.progress).toBe(89n);
});
