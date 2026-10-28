import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import {
  activateMentalHeartInduce,
  induceMentalHearts,
} from '@akaakuhub/suku-sute-core/game/effects/mentalHeartInduce';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { game } from './support/game';

it('Action23はActionType1の値を参照実装のintキャストで0方向へ切り捨てる', () => {
  const initial = game();
  const withBuff = {
    ...initial,
    resourceBoosts: [{ target: 'attract' as const, percent: 50, uses: null }],
  };
  const card = initial.deck[0];
  if (!card) throw new Error('検証カードがありません。');
  const inducing = activateMentalHeartInduce(
    withBuff,
    {
      kind: 'mental-heart-induce',
      num: 10_000n,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'stage', value: 0n },
      disabledType: 0,
      disabledValue: 0n,
    },
    card,
    1,
    0,
  );
  expect(heartCount(induceMentalHearts(inducing, 1))).toBe(1);
});

it('Action23は解除回数を参照実装のint32として折り返してlong閾値と比較する', () => {
  const initial = game();
  const state = {
    ...initial,
    mentalHeartInducers: [
      {
        id: 1,
        sourceCardId: null,
        precomputedNum: 0,
        heartLifetimeSeconds: 1,
        remainingSeconds: null,
        remainingSections: null,
        disabledOnInduceCount: -2_147_483_648n,
        induces: 2_147_483_647,
        deactivationKey: null,
      },
    ],
  };
  expect(induceMentalHearts(state, 1).mentalHeartInducers).toHaveLength(0);
});

it('Action23はActionType52の値も参照実装のintキャストで0方向へ切り捨てる', () => {
  const initial = game();
  const withBuff = applyEffect(initial, {
    kind: 'skill-boost',
    num: 500_000,
    target: { kind: 'all' },
    duration: { kind: 'stage', value: 0n },
    uses: null,
  });
  const card = initial.deck[0];
  if (!card) throw new Error('検証カードがありません。');
  const inducing = activateMentalHeartInduce(
    withBuff,
    {
      kind: 'mental-heart-induce',
      num: 10_000n,
      heartDuration: { kind: 'stage', value: 0 },
      duration: { kind: 'stage', value: 0n },
      disabledType: 0,
      disabledValue: 0n,
    },
    card,
    1,
    0,
  );
  expect(heartCount(induceMentalHearts(inducing, 1))).toBe(1);
});

it('Action23はActionType16のメンバー・ユニット・トークン系列対象を発動元で判定する', () => {
  const initial = game();
  const original = initial.deck[0];
  const unit = original?.unitIds[0];
  if (!original || (unit !== 1 && unit !== 2 && unit !== 3))
    throw new Error('対象カードがありません。');
  const source = { ...original, tokenSeriesIds: [42] };
  const state = {
    ...initial,
    deck: initial.deck.map((card) =>
      card.cardInstanceId === source.cardInstanceId ? source : card,
    ),
    cardPool: initial.cardPool.map((card) =>
      card.cardInstanceId === source.cardInstanceId ? source : card,
    ),
  };
  const targets = [
    { kind: 'member', member: source.charactersId },
    { kind: 'unit', unit },
    { kind: 'card-series', seriesId: 42 },
  ] as const;

  for (const target of targets) {
    const boosted = applyEffect(
      state,
      {
        kind: 'heart-boost',
        percent: 50,
        uses: 1n,
        target,
        duration: { kind: 'stage' },
      },
      source,
    );
    const inducing = activateMentalHeartInduce(
      boosted,
      {
        kind: 'mental-heart-induce',
        num: 10n,
        heartDuration: { kind: 'milliseconds', value: 250 },
        duration: { kind: 'stage', value: 0n },
        disabledType: 0,
        disabledValue: 0n,
      },
      source,
      1,
      0,
    );

    const result = induceMentalHearts(inducing, 10_000);
    expect(heartCount(result) - heartCount(state)).toBe(15);
    expect(result.heartBoosts).toHaveLength(0);
  }
});
