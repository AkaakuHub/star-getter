import { expect, it } from 'vite-plus/test';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import type { CardUse } from '@akaakuhub/suku-sute-core/game/model';
import { cardMotion } from '../../src/presentation/cards/cardMotion';
import { handGeometry } from '../../src/presentation/handLayout';

it('使用位置から0.25秒で中央へ移動し、発動後の0.25秒でフェードする', () => {
  const card = resolveDeck(defaultDeckIds)[0];
  if (!card) throw new Error('カードがありません。');
  const action: CardUse = { key: 1, tick: 0, card, cost: 3, handIndex: 0, handCount: 5 };
  const start = handGeometry(0, 5);
  expect(cardMotion(action, 0)).toEqual({ ...start, alpha: 1 });
  expect(cardMotion(action, 125).x).toBeCloseTo((start.x + 456) / 2);
  expect(cardMotion(action, 250)).toMatchObject({ x: 456, y: 846, alpha: 1 });
  expect(cardMotion(action, 250).rotation).toBeCloseTo(0);
  expect(cardMotion(action, 750).alpha).toBe(1);
  expect(cardMotion(action, 875).alpha).toBe(0.25);
  expect(cardMotion(action, 1000).alpha).toBe(0);
});
