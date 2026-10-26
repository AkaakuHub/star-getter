import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import {
  advanceFixedParameterExtends,
  expireFixedParameterExtendSections,
} from '../../src/domain/game/effects/fixedParameterExtend';
import { changeResource } from '../../src/domain/game/resources';
import { conditionContext } from '../../src/domain/game/conditions/gameContext';
import { game } from './support/game';

it('AP上限へ加算・乗算・固定値を登録順に適用する', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const added = applyEffect(
    initial,
    {
      kind: 'fixed-parameter-extend',
      target: 'ap',
      calculation: 'add',
      value: 10n,
      duration: { kind: 'stage' },
    },
    source,
  );
  expect(added.maxEnergy).toBe(Math.min(100, initial.maxEnergy + 10));
  const multiplied = applyEffect(
    added,
    {
      kind: 'fixed-parameter-extend',
      target: 'ap',
      calculation: 'multiply',
      value: 10_000n,
      duration: { kind: 'stage' },
    },
    source,
  );
  expect(multiplied.maxEnergy).toBe(Math.min(100, (initial.maxEnergy + 10) * 2));
  const fixed = applyEffect(
    { ...multiplied, energy: 100 },
    {
      kind: 'fixed-parameter-extend',
      target: 'ap',
      calculation: 'fixed',
      value: 30n,
      duration: { kind: 'stage' },
    },
  );
  expect(fixed.maxEnergy).toBe(30);
  expect(fixed.energy).toBe(30);
});

it('ActionType58の値をC#のint32へ変換する', () => {
  const extended = applyEffect(game(), {
    kind: 'fixed-parameter-extend',
    target: 'ap',
    calculation: 'fixed',
    value: 9_007_201_402_224_640n,
    duration: { kind: 'stage' },
  });
  expect(extended.fixedParameterExtends[0]?.value).toBe(-2_147_483_648);
});

it('ActionType58の熱気上限をStageVoltageLevelSettingsの最終段階で止める', () => {
  const extended = applyEffect(game(), {
    kind: 'fixed-parameter-extend',
    target: 'voltage',
    calculation: 'fixed',
    value: 3_000n,
    duration: { kind: 'stage' },
  });
  expect(extended.maximumVoltageLevel).toBe(2_000);
});

it('期限終了後にAP上限を元へ戻す', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const timed = applyEffect(
    initial,
    {
      kind: 'fixed-parameter-extend',
      target: 'ap',
      calculation: 'add',
      value: 10n,
      duration: { kind: 'milliseconds', value: 100n },
    },
    source,
  );
  expect(timed.maxEnergy).toBe(Math.min(100, initial.maxEnergy + 10));
  expect(advanceFixedParameterExtends(timed, 0.1).maxEnergy).toBe(initial.maxEnergy);

  const sectionTimed = applyEffect(
    initial,
    {
      kind: 'fixed-parameter-extend',
      target: 'ap',
      calculation: 'add',
      value: 10n,
      duration: { kind: 'sections', value: 1n },
    },
    source,
  );
  expect(expireFixedParameterExtendSections(sectionTimed).maxEnergy).toBe(initial.maxEnergy);
});

it('元気上限を伸ばして回復し、比率シールドに拡張後の上限を使う', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const extended = applyEffect(
    initial,
    {
      kind: 'fixed-parameter-extend',
      target: 'mental',
      calculation: 'add',
      value: 50n,
      duration: { kind: 'stage' },
    },
    source,
  );
  expect(extended.maximumMental).toBe(150);
  expect(changeResource(extended, 'stamina', 100n).stamina).toBe(150);
  expect(conditionContext({ ...extended, stamina: 150 }).staminaPercent).toBe(100);
  const shield = applyEffect(
    extended,
    {
      kind: 'mental-shield',
      durabilityType: 1n,
      durability: 100_000n,
      duration: { kind: 'stage' },
      applyCount: 0n,
    },
    source,
  );
  expect(shield.mentalShields[0]?.durability).toBe(15);
});
