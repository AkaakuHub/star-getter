import { expect, it } from 'vite-plus/test';
import { completeDeckOutChecks } from '../../src/domain/game/effects/deckOutCheck';
import { game } from './support/game';

it('デッキアウト確認ごとに1件だけ消費してAfterMentalDown通知を記録する', () => {
  const initial = { ...game(), deckOutCount: 3 };

  const first = completeDeckOutChecks(initial);
  const second = completeDeckOutChecks(first);

  expect(first.deckOutCount).toBe(2);
  expect(first.afterMentalDownEvents).toBe(1);
  expect(second.deckOutCount).toBe(1);
  expect(second.afterMentalDownEvents).toBe(2);
});

it('デッキアウトがなければAfterMentalDown通知を送らない', () => {
  const initial = game();

  expect(completeDeckOutChecks(initial)).toBe(initial);
});
