import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import type { Card } from '../../src/domain/game/model';
import { advanceTo } from '../../src/domain/game/simulation';
import { game, withHand } from './support/game';

function card(state: ReturnType<typeof game>, id: string): Card {
  const value = state.deck.find((item) => item.id === id);
  if (!value) throw new Error('カードがありません。');
  return value;
}

it('指定系列を別デッキへ分け、切替後に統合する', () => {
  const base = game('bloom');
  const selectedId = base.deck[5]?.id;
  if (!selectedId) throw new Error('対象カードがありません。');
  const deck = base.deck.map((item) =>
    item.id === selectedId ? { ...item, tokenSeriesIds: [42] } : item,
  );
  const state = withHand({ ...base, deck }, [base.hand[0] ?? '', selectedId]);
  const split = applyEffect(state, {
    kind: 'token-deck-split',
    seriesIds: [42],
    duration: { kind: 'stage', value: 0 },
    deactivationKey: 'test-split',
  });
  expect(split.hand).not.toContain(selectedId);
  expect(split.tokenDeckSplit?.sub.hand.length).toBeGreaterThan(0);
  const switched = act(split, { type: 'switch-token-deck' });
  expect(switched.tokenDeckSplit?.active).toBe('sub');
  expect(
    switched.hand.every((id) =>
      switched.tokenDeckSplit?.seriesIds?.some((seriesId) =>
        card(switched, id).tokenSeriesIds?.includes(seriesId),
      ),
    ),
  ).toBe(true);
  const merged = act(switched, { type: 'deactivate-token-deck', deactivationKey: 'test-split' });
  expect(merged.tokenDeckSplit).toBeNull();
  expect(
    merged.deck
      .map((item) => item.id)
      .filter(
        (id) =>
          merged.hand.includes(id) || merged.drawPile.includes(id) || merged.discard.includes(id),
      ),
  ).toContain(selectedId);
});

it('期限切れでメインデッキへ戻す', () => {
  const base = game('bloom');
  const selectedId = base.deck[5]?.id;
  if (!selectedId) throw new Error('対象カードがありません。');
  const deck = base.deck.map((item) =>
    item.id === selectedId ? { ...item, tokenSeriesIds: [42] } : item,
  );
  const state = withHand({ ...base, deck }, [base.hand[0] ?? '']);
  const split = applyEffect(state, {
    kind: 'token-deck-split',
    seriesIds: [42],
    duration: { kind: 'milliseconds', value: 1 },
  });
  expect(advanceTo(split, 0.1).tokenDeckSplit).toBeNull();
});
