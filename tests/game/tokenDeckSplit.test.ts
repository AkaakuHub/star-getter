import { boardCardIds, moveCardsToBoard } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import {
  liveBoardState,
  liveDeckBoardCardInstanceIds,
} from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { shuffleHand } from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { conditionContext } from '@akaakuhub/suku-sute-core/game/conditions/gameContext';
import { evaluateCondition } from '@akaakuhub/suku-sute-core/game/conditions/evaluate';
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
  const base = game('genesis');
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
          merged.hand.includes(id) ||
          boardCardIds(merged, liveBoardState.deck).includes(id) ||
          boardCardIds(merged, liveBoardState.graveyard).includes(id),
      ),
  ).toContain(selectedId);
});

it('ActionType43はサブデッキへ移す選択系列の捨て札を山札へ戻す', () => {
  const base = game('genesis');
  const selected = base.deck[5];
  if (!selected) throw new Error('対象カードがありません。');
  const cardData = { ...selected, tokenSeriesIds: [42] };
  const hand = withHand(
    {
      ...base,
      deck: base.deck.map((item) => (item.id === selected.id ? cardData : item)),
    },
    [base.hand[0] ?? ''],
  );
  const state = moveCardsToBoard(hand, [selected.id], liveBoardState.graveyard);
  expect(
    state.deckBoard.cards.find((card) => card.cardInstanceId === selected.id)?.boardState,
  ).toBe(3);
  const split = applyEffect(state, {
    kind: 'token-deck-split',
    seriesIds: [42n],
    duration: { kind: 'stage', value: 0 },
  });
  expect([
    ...(split.tokenDeckSplit?.sub.hand ?? []),
    ...split.deckBoard.cards
      .filter(
        (card) =>
          card.boardState === 1 &&
          split.tokenDeckSplit?.subDeckCardInstanceIds.includes(card.cardInstanceId),
      )
      .map((card) => card.cardInstanceId),
  ]).toContain(selected.id);
  expect(
    split.deckBoard.cards.find((card) => card.cardInstanceId === selected.id)?.boardState,
  ).not.toBe(3);
});

it('ActionType43の系列IDを参照実装のint32へ変換してから照合する', () => {
  const base = game('genesis');
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
    ...split.deckBoard.cards
      .filter(
        (card) =>
          card.boardState === 1 &&
          split.tokenDeckSplit?.subDeckCardInstanceIds.includes(card.cardInstanceId),
      )
      .map((card) => card.cardInstanceId),
  ]).toContain(selected.id);
});

it('ActionType43の分割後にデッキアウト確認を実行する', () => {
  const base = game('genesis');
  const selected = base.deck[5];
  if (!selected) throw new Error('対象カードがありません。');
  const state = {
    ...base,
    deck: base.deck.map((item) =>
      item.id === selected.id ? { ...item, tokenSeriesIds: [42] } : item,
    ),
    deckOutCount: 1,
    track: { ...base.track, afterMentalDownEffects: [{ kind: 'ap' as const, amount: 2 }] },
  };
  const split = applyEffect(state, {
    kind: 'token-deck-split',
    seriesIds: [42n],
    duration: { kind: 'stage', value: 0 },
  });
  expect(split.deckOutCount).toBe(0);
  expect(split.afterMentalDownEvents).toBe(state.afterMentalDownEvents + 1);
  expect(split.ap.currentAp).toBe(state.ap.currentAp + 2);
});

it('ActionType43は空のサブデッキへの切替後にデッキアウト確認を実行する', () => {
  const base = game('genesis');
  const selected = base.deck[5];
  if (!selected) throw new Error('対象カードがありません。');
  const split = applyEffect(
    {
      ...base,
      deck: base.deck.map((item) =>
        item.id === selected.id ? { ...item, tokenSeriesIds: [42] } : item,
      ),
      track: { ...base.track, afterMentalDownEffects: [{ kind: 'ap' as const, amount: 2 }] },
    },
    { kind: 'token-deck-split', seriesIds: [42n], duration: { kind: 'stage', value: 0 } },
  );
  const emptySubDeck = split.tokenDeckSplit;
  if (!emptySubDeck) throw new Error('分割デッキがありません。');
  const switched = act(
    {
      ...moveCardsToBoard(split, [selected.id], liveBoardState.extra),
      deckOutCount: 1,
      tokenDeckSplit: { ...emptySubDeck, sub: { hand: [] } },
    },
    { type: 'switch-token-deck' },
  );
  expect(switched.deckOutCount).toBe(0);
  expect(switched.afterMentalDownEvents).toBe(split.afterMentalDownEvents + 1);
  expect(switched.ap.currentAp).toBe(split.ap.currentAp + 2);
});

it('期限切れでメインデッキへ戻す', () => {
  const base = game('genesis');
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

it('枚数条件はメインとサブ両方の山札・捨て札を切替後も合計する', () => {
  const base = game('genesis');
  const main = base.deck.at(-1);
  if (!main) throw new Error('メインカードがありません。');
  const deck = base.deck.map((card) =>
    card.id === main.id ? card : { ...card, tokenSeriesIds: [42] },
  );
  const initial = withHand({ ...base, deck, cardPool: deck }, [main.id]);
  const split = applyEffect(initial, {
    kind: 'token-deck-split',
    seriesIds: [42n],
    duration: { kind: 'stage', value: 0 },
  });
  const splitState = split.tokenDeckSplit;
  if (!splitState) throw new Error('分割状態がありません。');
  const subDeck = split.deckBoard.cards
    .filter(
      (card) =>
        card.boardState === 1 && splitState.subDeckCardInstanceIds.includes(card.cardInstanceId),
    )
    .map((card) => card.cardInstanceId);
  const [discarded, ...drawPile] = subDeck;
  if (!discarded || drawPile.length < 1) throw new Error('サブデッキの山札が不足しています。');
  const state = moveCardsToBoard(split, [discarded], liveBoardState.graveyard);
  const drawCount = liveDeckBoardCardInstanceIds(state.deckBoard, liveBoardState.deck).length;
  const discardCount = liveDeckBoardCardInstanceIds(
    state.deckBoard,
    liveBoardState.graveyard,
  ).length;
  const assertCounts = (current: typeof split, draw: number, discard: number) => {
    const input = conditionContext(current);
    expect(input.cardTotal).toBe(current.deck.length);
    expect(evaluateCondition({ kind: 'cards', zone: 'draw', minimum: draw }, input)).toBe(true);
    expect(evaluateCondition({ kind: 'cards', zone: 'draw', minimum: draw + 1 }, input)).toBe(
      false,
    );
    expect(evaluateCondition({ kind: 'cards', zone: 'discard', minimum: discard }, input)).toBe(
      true,
    );
    expect(evaluateCondition({ kind: 'cards', zone: 'discard', minimum: discard + 1 }, input)).toBe(
      false,
    );
  };
  assertCounts(state, drawCount, discardCount);
  const switched = act(state, { type: 'switch-token-deck' });
  expect(switched.tokenDeckSplit?.active).toBe('sub');
  assertCounts(switched, drawCount, discardCount);
  const [moved] = boardCardIds(switched, liveBoardState.deck);
  if (!moved) throw new Error('移動する山札のカードがありません。');
  const updated = moveCardsToBoard(switched, [moved], liveBoardState.graveyard);
  assertCounts(updated, drawCount - 1, discardCount + 1);
  const returned = act(updated, { type: 'switch-token-deck' });
  expect(returned.tokenDeckSplit?.active).toBe('main');
  assertCounts(returned, drawCount - 1, discardCount + 1);
});

it('停止中のサブ手札統計はメイン手札の引き直しで消えず、統合時に破棄する', () => {
  const base = game('genesis');
  const selected = base.deck[5];
  if (!selected) throw new Error('対象カードがありません。');
  const deck = base.deck.map((item) =>
    item.id === selected.id ? { ...item, tokenSeriesIds: [42] } : item,
  );
  const initial = withHand({ ...base, deck, cardPool: deck }, [base.hand[0] ?? '', selected.id]);
  const split = applyEffect(initial, {
    kind: 'token-deck-split',
    seriesIds: [42n],
    duration: { kind: 'stage', value: 0 },
    deactivationKey: 'statistics-split',
  });
  const stats = split.handCardStats[selected.id];
  expect(stats).toBeDefined();
  expect(stats?.isActive).toBe(false);
  const shuffled = shuffleHand(split, { recoverDiscard: false, destination: 'discard' });
  expect(shuffled.handCardStats[selected.id]).toBe(stats);
  const switched = act(shuffled, { type: 'switch-token-deck' });
  expect(switched.handCardStats[selected.id]?.isActive).toBe(true);
  const merged = act(switched, {
    type: 'deactivate-token-deck',
    deactivationKey: 'statistics-split',
  });
  expect(merged.handCardStats[selected.id]).toBeUndefined();
});
