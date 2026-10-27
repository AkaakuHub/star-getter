import { expect, it } from 'vite-plus/test';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { applyScoreBoost } from '@akaakuhub/suku-sute-core/game/effects/scoreBoost';
import { game } from './support/game';
import { addHearts, collectHearts } from '@akaakuhub/suku-sute-core/game/hearts';

it('ActionType30は対象カードのSTAR増加を指定率で増幅し、回収時に解除する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const target = initial.deck.find((card) => card.id === 'rain-preparation');
  if (!source || !target) throw new Error('検証用カードがありません。');
  const clean = {
    ...initial,
    amplification: 100,
    storyAmplification: 0,
    handEffectCardIds: [],
    targetBoosts: [],
    resourceBoosts: [],
  };
  const buffed = applyEffect(
    clean,
    {
      kind: 'love-up-additional-buff',
      calculation: 1n,
      num: 500_000n,
      target: { kind: 'member', member: target.member },
      duration: { kind: 'milliseconds', value: 10_000n },
      disabledType: 1,
      disabledCount: 2n,
    },
    source,
  );
  const used = applyScoreBoost(buffed, 100, target);
  expect(used.boosts[0]?.percent).toBe(150);
  expect(used.loveUpAdditionalBuffs[0]?.remainingUses).toBe(1n);
  const unmatched = applyScoreBoost(buffed, 100, source);
  expect(unmatched.boosts[0]?.percent).toBe(100);
  expect(unmatched.loveUpAdditionalBuffs).toHaveLength(1);
  expect(collectHearts(addHearts(used, 1)).loveUpAdditionalBuffs[0]?.remainingUses).toBe(1n);
  expect(applyScoreBoost(used, 100, target).loveUpAdditionalBuffs).toHaveLength(0);
});

it('ActionType30は期限・InvocationType抑止・Deactivator解除を処理する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const effect = {
    kind: 'love-up-additional-buff',
    calculation: 1n,
    num: 1_000_000n,
    target: { kind: 'all' },
    duration: { kind: 'milliseconds', value: 500n },
    disabledType: 0,
    disabledCount: 0n,
  } as const;
  const timed = applyEffect(initial, effect, source);
  expect(advanceTo(timed, 0.6).loveUpAdditionalBuffs).toHaveLength(0);
  const permanent = applyEffect(
    initial,
    { ...effect, invocationType: 0x388, deactivationKey: 'love-up-test' },
    source,
  );
  expect(advanceTo(permanent, 0.6).loveUpAdditionalBuffs).toHaveLength(1);
  const deactivated = act(permanent, {
    type: 'deactivate-love-up-additional-buff',
    deactivationKey: 'love-up-test',
  });
  expect(deactivated.loveUpAdditionalBuffs).toHaveLength(0);
});

it('ActionType30はパート期限で追加バフを解除する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  const nextSection = initial.track.sections[1];
  if (!source || !nextSection) throw new Error('検証用データがありません。');
  const active = applyEffect(
    initial,
    {
      kind: 'love-up-additional-buff',
      calculation: 1n,
      num: 1_000_000n,
      target: { kind: 'all' },
      duration: { kind: 'sections', value: 1n },
      disabledType: 0,
      disabledCount: 0n,
    },
    source,
  );
  expect(active.loveUpAdditionalBuffs).toHaveLength(1);
  expect(
    advanceTo(active, (nextSection.startBeat * 60) / active.track.bpm + 1 / 60)
      .loveUpAdditionalBuffs,
  ).toHaveLength(0);
});

it('ActionType30の登録値にActionType52を適用し、回数を消費する', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const action52 = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      uses: 1n,
    },
    source,
  );
  const additional = applyEffect(
    action52,
    {
      kind: 'love-up-additional-buff',
      calculation: 1n,
      num: 500_000n,
      target: { kind: 'all' },
      duration: { kind: 'stage', value: 0n },
      disabledType: 0,
      disabledCount: 0n,
    },
    source,
  );
  expect(additional.loveUpAdditionalBuffs[0]?.percent).toBe(75);
  expect(additional.action52Buffs).toHaveLength(0);
});

it('ActionType30は小数の追加率を参照実装のintキャストで0方向へ切り捨てる', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  const percentages = [6_000, -6_000, 5_000, 15_000].map(
    (num) =>
      applyEffect(
        initial,
        {
          kind: 'love-up-additional-buff',
          calculation: 1n,
          num: BigInt(num),
          target: { kind: 'all' },
          duration: { kind: 'stage', value: 0n },
          disabledType: 0,
          disabledCount: 0n,
        },
        source,
      ).loveUpAdditionalBuffs[0]?.percent,
  );
  expect(percentages).toEqual([undefined, undefined, undefined, 1]);
});

it('ActionType30は0以下の計算値を追加バフとして登録しない', () => {
  const initial = game();
  const source = initial.deck.find((card) => card.id === 'class');
  if (!source) throw new Error('発動元カードがありません。');
  for (const num of [0, -10_000]) {
    const result = applyEffect(
      initial,
      {
        kind: 'love-up-additional-buff',
        calculation: 1n,
        num: BigInt(num),
        target: { kind: 'all' },
        duration: { kind: 'stage', value: 0n },
        disabledType: 1,
        disabledCount: 1n,
      },
      source,
    );
    expect(result.loveUpAdditionalBuffs).toHaveLength(0);
  }
});
