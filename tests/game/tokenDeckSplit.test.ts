import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { advanceTo } from '@akaakuhub/suku-sute-core/game/simulation';
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
    seriesIds: [42n],
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

it('ActionType43はサブデッキへ移す選択系列の捨て札を山札へ戻す', () => {
  const base = game('bloom');
  const selected = base.deck[5];
  if (!selected) throw new Error('対象カードがありません。');
  const cardData = { ...selected, tokenSeriesIds: [42] };
  const state = withHand(
    {
      ...base,
      deck: base.deck.map((item) => (item.id === selected.id ? cardData : item)),
      discard: [selected.id],
      drawPile: base.drawPile.filter((id) => id !== selected.id),
    },
    [base.hand[0] ?? ''],
  );
  const split = applyEffect(state, {
    kind: 'token-deck-split',
    seriesIds: [42n],
    duration: { kind: 'stage', value: 0 },
  });
  expect([
    ...(split.tokenDeckSplit?.sub.hand ?? []),
    ...(split.tokenDeckSplit?.sub.drawPile ?? []),
  ]).toContain(selected.id);
  expect(split.tokenDeckSplit?.sub.discard).not.toContain(selected.id);
});

it('ActionType43の系列IDを参照実装のint32へ変換してから照合する', () => {
  const base = game('bloom');
  const selected = base.deck[5];
  if (!selected) throw new Error('対象カードがありません。');
  const state = {
    ...base,
    deck: base.deck.map((item) =>
      item.id === selected.id ? { ...item, tokenSeriesIds: [42] } : item,
    ),
  };
  const split = applyEffect(state, {
    kind: 'token-deck-split',
    seriesIds: [4_294_967_338n],
    duration: { kind: 'stage', value: 0 },
  });
  expect(split.tokenDeckSplit?.seriesIds).toEqual([42]);
  expect([
    ...(split.tokenDeckSplit?.sub.hand ?? []),
    ...(split.tokenDeckSplit?.sub.drawPile ?? []),
  ]).toContain(selected.id);
});

it('ActionType43の分割後にデッキアウト確認を実行する', () => {
  const base = game('bloom');
  const selected = base.deck[5];
  if (!selected) throw new Error('対象カードがありません。');
  const state = {
    ...base,
    deck: base.deck.map((item) =>
      item.id === selected.id ? { ...item, tokenSeriesIds: [42] } : item,
    ),
    deckOutCount: 1,
    track: { ...base.track, afterMentalDownEffects: [{ kind: 'energy' as const, amount: 2 }] },
  };
  const split = applyEffect(state, {
    kind: 'token-deck-split',
    seriesIds: [42n],
    duration: { kind: 'stage', value: 0 },
  });
  expect(split.deckOutCount).toBe(0);
  expect(split.afterMentalDownEvents).toBe(state.afterMentalDownEvents + 1);
  expect(split.energy).toBe(state.energy + 2);
});

it('ActionType43は空のサブデッキへの切替後にデッキアウト確認を実行する', () => {
  const base = game('bloom');
  const selected = base.deck[5];
  if (!selected) throw new Error('対象カードがありません。');
  const split = applyEffect(
    {
      ...base,
      deck: base.deck.map((item) =>
        item.id === selected.id ? { ...item, tokenSeriesIds: [42] } : item,
      ),
      track: { ...base.track, afterMentalDownEffects: [{ kind: 'energy' as const, amount: 2 }] },
    },
    { kind: 'token-deck-split', seriesIds: [42n], duration: { kind: 'stage', value: 0 } },
  );
  const emptySubDeck = split.tokenDeckSplit;
  if (!emptySubDeck) throw new Error('分割デッキがありません。');
  const switched = act(
    {
      ...split,
      deckOutCount: 1,
      tokenDeckSplit: { ...emptySubDeck, sub: { hand: [], drawPile: [], discard: [] } },
    },
    { type: 'switch-token-deck' },
  );
  expect(switched.deckOutCount).toBe(0);
  expect(switched.afterMentalDownEvents).toBe(split.afterMentalDownEvents + 1);
  expect(switched.energy).toBe(split.energy + 2);
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
    seriesIds: [42n],
    duration: { kind: 'milliseconds', value: 1 },
  });
  expect(advanceTo(split, 0.1).tokenDeckSplit).toBeNull();
});
