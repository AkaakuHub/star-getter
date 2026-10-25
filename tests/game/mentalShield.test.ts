import { expect, it } from 'vite-plus/test';
import { changeResource } from '../../src/domain/game/resources';
import { applyEffect } from '../../src/domain/game/effects';
import {
  advanceMentalShields,
  expireMentalShieldSections,
} from '../../src/domain/game/effects/mentalShield';
import { game } from './support/game';

it('固定耐久を追加値と乗算係数へ適用してから整数耐久にする', () => {
  const state = applyEffect(
    game(),
    {
      kind: 'mental-shield',
      durabilityType: 2,
      durability: 100_000,
      duration: { kind: 'stage' },
      applyCount: 0,
    },
    undefined,
    2,
    20_000,
  );
  expect(state.mentalShields[0]?.durability).toBe(24);
});

it('比例耐久に最大元気とEffectPowerを適用する', () => {
  const state = applyEffect(
    game(),
    {
      kind: 'mental-shield',
      durabilityType: 1,
      durability: 100_000,
      duration: { kind: 'stage' },
      applyCount: 0,
    },
    undefined,
    2,
    0,
    3,
  );
  expect(state.mentalShields[0]?.durability).toBe(60);
});

it('耐久を登録順に消費し、適用回数を使い切るとシールドを除去する', () => {
  const state = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 2,
    durability: 100_000,
    duration: { kind: 'stage' },
    applyCount: 1,
  });
  const blocked = changeResource(state, 'stamina', -4n, 'natural');
  expect(blocked.stamina).toBe(100);
  expect(blocked.mentalShields).toHaveLength(0);
});

it('先に登録したシールドから消費し、残りのダメージを次へ渡す', () => {
  const first = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 2,
    durability: 20_000,
    duration: { kind: 'stage' },
    applyCount: 0,
  });
  const second = applyEffect(first, {
    kind: 'mental-shield',
    durabilityType: 2,
    durability: 30_000,
    duration: { kind: 'stage' },
    applyCount: 0,
  });
  const damaged = changeResource(second, 'stamina', -4n, 'natural');
  expect(damaged.stamina).toBe(100);
  expect(damaged.mentalShields).toHaveLength(1);
  expect(damaged.mentalShields[0]?.durability).toBe(1);
});

it('無限耐久はダメージを全て防ぎ、ミリ秒・次パート期限で失効する', () => {
  const infinite = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 3,
    durability: 1,
    duration: { kind: 'milliseconds', value: 100 },
    applyCount: 0,
  });
  const blocked = changeResource(infinite, 'stamina', -30n, 'natural');
  expect(blocked.stamina).toBe(100);
  expect(advanceMentalShields(blocked, 0.1).mentalShields).toHaveLength(0);

  const sectionShield = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 2,
    durability: 100_000,
    duration: { kind: 'sections', value: 0 },
    applyCount: 0,
  });
  expect(sectionShield.mentalShields[0]?.remainingSections).toBe(1);
  expect(expireMentalShieldSections(sectionShield).mentalShields).toHaveLength(0);
});

it('ActionType56の耐久値をC#のint32へ変換する', () => {
  const shielded = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 3,
    durability: 2_147_483_648,
    duration: { kind: 'stage' },
    applyCount: 0,
  });
  expect(shielded.mentalShields[0]?.durability).toBe(-2_147_483_648);
  expect(changeResource(shielded, 'stamina', -10n, 'natural').stamina).toBe(90);
});
