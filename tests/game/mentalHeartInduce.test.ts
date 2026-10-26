import { expect, it } from 'vite-plus/test';
import { applyEffect } from '../../src/domain/game/effects';
import {
  activateMentalHeartInduce,
  induceMentalHearts,
} from '../../src/domain/game/effects/mentalHeartInduce';
import { heartCount } from '../../src/domain/game/hearts';
import { game } from './support/game';

it('Action23はActionType1の値をC#のintキャストで0方向へ切り捨てる', () => {
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

it('Action23はActionType52の値もC#のintキャストで0方向へ切り捨てる', () => {
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
