import { expect, it } from 'vite-plus/test';
import { changeResource } from '@akaakuhub/suku-sute-core/game/resources';
import { decreaseMentalNaturally } from '@akaakuhub/suku-sute-core/game/resources';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import {
  advanceMentalShields,
  expireMentalShieldSections,
} from '@akaakuhub/suku-sute-core/game/effects/mentalShield';
import { game } from './support/game';

it('自然減少はシールドの耐久値と適用回数を消費しない', () => {
  const state = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 2n,
    durability: 100000n,
    duration: { kind: 'stage' },
    applyCount: 1n,
  });
  const decreased = decreaseMentalNaturally(state);
  expect(decreased.currentMental).toBe(state.currentMental - 1);
  expect(decreased.mentalShields).toEqual(state.mentalShields);
});

it('固定耐久を追加値と乗算係数へ適用してから整数耐久にする', () => {
  const state = applyEffect(
    game(),
    {
      kind: 'mental-shield',
      durabilityType: 2n,
      durability: 100_000n,
      duration: { kind: 'stage' },
      applyCount: 0n,
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
      durabilityType: 1n,
      durability: 100_000n,
      duration: { kind: 'stage' },
      applyCount: 0n,
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
    durabilityType: 2n,
    durability: 100_000n,
    duration: { kind: 'stage' },
    applyCount: 1n,
  });
  const blocked = changeResource(state, 'mental', -4n, 'skill');
  expect(blocked.currentMental).toBe(100);
  expect(blocked.mentalShields).toHaveLength(0);
});

it('先に登録したシールドから消費し、残りのダメージを次へ渡す', () => {
  const first = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 2n,
    durability: 20_000n,
    duration: { kind: 'stage' },
    applyCount: 0n,
  });
  const second = applyEffect(first, {
    kind: 'mental-shield',
    durabilityType: 2n,
    durability: 30_000n,
    duration: { kind: 'stage' },
    applyCount: 0n,
  });
  const damaged = changeResource(second, 'mental', -4n, 'skill');
  expect(damaged.currentMental).toBe(100);
  expect(damaged.mentalShields).toHaveLength(1);
  expect(damaged.mentalShields[0]?.durability).toBe(1);
});

it('無限耐久はダメージを全て防ぎ、ミリ秒・次パート期限で失効する', () => {
  const infinite = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 3n,
    durability: 1n,
    duration: { kind: 'milliseconds', value: 100n },
    applyCount: 0n,
  });
  const blocked = changeResource(infinite, 'mental', -30n, 'skill');
  expect(blocked.currentMental).toBe(100);
  expect(advanceMentalShields(blocked, 0.1).mentalShields).toHaveLength(0);

  const sectionShield = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 2n,
    durability: 100_000n,
    duration: { kind: 'sections', value: 0n },
    applyCount: 0n,
  });
  expect(sectionShield.mentalShields[0]?.remainingSections).toBe(1);
  expect(expireMentalShieldSections(sectionShield).mentalShields).toHaveLength(0);
});

it('ActionType56の耐久値を参照実装のint32へ変換する', () => {
  const shielded = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 3n,
    durability: 2_147_483_648n,
    duration: { kind: 'stage' },
    applyCount: 0n,
  });
  expect(shielded.mentalShields[0]?.durability).toBe(-2_147_483_648);
  expect(changeResource(shielded, 'mental', -10n, 'skill').currentMental).toBe(90);
});

it('ActionType56は2^53超のlong詳細値を正確にint32化する', () => {
  const shield = applyEffect(game(), {
    kind: 'mental-shield',
    durabilityType: 2n,
    durability: 9_007_199_254_750_991n,
    duration: { kind: 'milliseconds', value: 9_007_199_254_750_991n },
    applyCount: 9_007_199_254_750_991n,
  });
  expect(shield.mentalShields[0]?.durability).toBe(0);
  expect(shield.mentalShields[0]?.applyCount).toBe(9_999);
  expect(shield.mentalShields[0]?.remainingSeconds).toBe(Math.fround(9_999 / 1_000));
});
