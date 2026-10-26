import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { moodValueWithoutLimit } from '../../src/domain/game/projection';
import { advanceTo } from '../../src/domain/game/simulation';
import type { MoodValueBoostEffect } from '../../src/domain/game/moodValueBoostTypes';
import { game } from './support/game';

function additiveBoost(
  overrides: Partial<Omit<MoodValueBoostEffect, 'kind'>> = {},
): MoodValueBoostEffect {
  return {
    kind: 'mood-value-boost' as const,
    calculationType: 2 as const,
    num: 10_000,
    bonusMoodTarget: 0 as const,
    bonusMoodValue: 0n,
    duration: { kind: 'stage' as const, value: 0n },
    disabledType: 0,
    disabledCount: 0,
    target: { kind: 'all' as const },
    ...overrides,
  };
}

function moodChange(num: number) {
  return {
    kind: 'mood-change-skill' as const,
    calculationType: 1 as const,
    num: BigInt(num),
    duration: { kind: 'stage' as const, value: 0n },
  };
}

it('Action50のAddとMultiply2をAction48の正負の絶対値へ適用する', () => {
  const initial = game('library');
  const card = initial.deck[0];
  if (!card) throw new Error('発動元カードがありません。');
  const additive = applyEffect(initial, additiveBoost());
  const increased = applyEffect(additive, moodChange(20_000), card);
  expect(moodValueWithoutLimit(increased)).toBe(3);
  const negative = applyEffect(additive, moodChange(-20_000), card);
  expect(moodValueWithoutLimit(negative)).toBe(-3);

  const multiplicative = applyEffect(initial, {
    ...additiveBoost(),
    calculationType: 1,
    num: 5_000_000,
  });
  const multiplied = applyEffect(multiplicative, moodChange(20_000), card);
  expect(moodValueWithoutLimit(multiplied)).toBe(12);
});

it('Action50の正値はActionType52で整数化し、回数を1回消費する', () => {
  const initial = game('library');
  const card = initial.deck[0];
  if (!card) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(initial, {
    kind: 'skill-boost',
    num: 1_000_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
  });
  const boosted = applyEffect(action52, additiveBoost({ disabledType: 1, disabledCount: 1 }), card);
  const first = applyEffect(boosted, moodChange(20_000), card);
  expect(moodValueWithoutLimit(first)).toBe(4);
  expect(first.moodValueAdditionalBuffs).toHaveLength(0);
  const second = applyEffect(first, moodChange(20_000), card);
  expect(moodValueWithoutLimit(second)).toBe(6);
});

it('Action50の詳細値をC#のint32へ変換してからNumToValueを計算する', () => {
  const initial = game('library');
  const wrapped = applyEffect(
    initial,
    additiveBoost({ calculationType: 2, num: 2_147_483_648 }),
    undefined,
  );
  expect(wrapped.moodValueAdditionalBuffs[0]?.value).toBe(-214_748.359375);
});

it('Action50のMultiply2値はC#のint castと同じく0方向へ切り捨てる', () => {
  const state = applyEffect(game('library'), additiveBoost({ calculationType: 1, num: 15_000 }));
  expect(state.moodValueAdditionalBuffs[0]?.value).toBe(1);
});

it('Action50はint cast後に正値を判定し、0になった値でActionType52を消費しない', () => {
  const initial = applyEffect(game('library'), {
    kind: 'skill-boost',
    num: 1_000_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: 1n,
  });
  const state = applyEffect(initial, additiveBoost({ calculationType: 1, num: 5_000 }));
  expect(state.moodValueAdditionalBuffs[0]?.value).toBe(0);
  expect(state.action52Buffs).toHaveLength(1);
});

it('Action50の対象とTokenCardSeriesパラメーターをC#の検索条件通りに扱う', () => {
  const initial = game('library');
  const card = initial.deck[0];
  const other = initial.deck.find((item) => item.member !== card?.member);
  if (!card || !other) throw new Error('対象カードが足りません。');
  const targeted = applyEffect(
    initial,
    additiveBoost({ target: { kind: 'member', member: card.member } }),
  );
  expect(moodValueWithoutLimit(applyEffect(targeted, moodChange(20_000), card))).toBe(3);
  const unmatched = applyEffect(targeted, moodChange(20_000), other);
  expect(moodValueWithoutLimit(unmatched)).toBe(2);
  expect(unmatched.moodValueAdditionalBuffs).toHaveLength(1);

  const seriesRestricted = applyEffect(initial, additiveBoost({ tokenCardSeriesIds: [1n] }));
  expect(moodValueWithoutLimit(applyEffect(seriesRestricted, moodChange(20_000), card))).toBe(2);
});

it('Action50は時間・パート期限とDeactivator解除を適用する', () => {
  const initial = game('library');
  const timed = applyEffect(
    initial,
    additiveBoost({
      duration: { kind: 'milliseconds', value: 1000n },
      deactivationKey: 'mood-boost',
      disabledType: 1,
      disabledCount: 1,
    }),
  );
  expect(advanceTo(timed, 1.1).moodValueAdditionalBuffs).toHaveLength(0);
  const section = applyEffect(
    initial,
    additiveBoost({ duration: { kind: 'sections', value: 1n } }),
  );
  const nextSection = initial.track.sections[1];
  if (!nextSection) throw new Error('パートがありません。');
  expect(
    advanceTo(section, (nextSection.startBeat * 60) / initial.track.bpm + 1 / 60)
      .moodValueAdditionalBuffs,
  ).toHaveLength(0);
  const deactivated = act(timed, {
    type: 'deactivate-mood-value-boost',
    deactivationKey: 'mood-boost',
  });
  expect(deactivated.moodValueAdditionalBuffs).toHaveLength(0);
});

it('Action50のOnBuffUseはdisabledTypeにかかわらず一度でBuffを解除する', () => {
  const initial = game('library');
  const card = initial.deck[0];
  if (!card) throw new Error('発動元カードがありません。');
  const active = applyEffect(initial, additiveBoost({ disabledType: 0, disabledCount: 0 }));
  const used = applyEffect(active, moodChange(20_000), card);
  expect(used.moodValueAdditionalBuffs).toHaveLength(0);
});

it('Action50のDeactivatorはdisabledType1以外では解除しない', () => {
  const initial = game('library');
  const persistent = applyEffect(
    initial,
    additiveBoost({ deactivationKey: 'mood-boost', disabledType: 0 }),
  );
  const deactivated = act(persistent, {
    type: 'deactivate-mood-value-boost',
    deactivationKey: 'mood-boost',
  });
  expect(deactivated.moodValueAdditionalBuffs).toHaveLength(1);
});

it('Action50が逆符号の加算を行うとAction48のBuff符号も反転する', () => {
  const initial = game('library');
  const card = initial.deck[0];
  if (!card) throw new Error('発動元カードがありません。');
  const negativeAdd = applyEffect(
    initial,
    additiveBoost({
      num: -100_000,
      bonusMoodTarget: 0,
      bonusMoodValue: 0n,
    }),
  );
  const changed = applyEffect(negativeAdd, moodChange(50_000), card);
  expect(moodValueWithoutLimit(changed)).toBe(-5);
});
