import { boardCardIds } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { liveBoardState } from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { collectHearts } from '@akaakuhub/suku-sute-core/game/hearts';
import { canActivateHandCollectionAbility } from '@akaakuhub/suku-sute-core/game/cards/collectionAbilities';
import { game, withHand } from './support/game';

it('複数の浮き輪が同時に回収効果を発動しても貝がら・舵・浮き輪を確保する', () => {
  let base = addTokens(addTokens(game('library'), 'bookmark', 4), 'story', 2);
  base = addTokens(base, 'clock', 3);
  base = addTokens(base, 'story', 95 - base.deck.length);
  const books = base.deck.filter((card) => card.token === 'bookmark');
  const book = books[0];
  const second = books[1];
  const third = books[2];
  const discarded = books[3];
  const story = base.deck.find((card) => card.token === 'story');
  if (!book || !second || !third || !discarded || !story)
    throw new Error('確認用カードがありません。');
  const hand = withHand(base, [book.id, second.id, third.id, story.id]);
  const ready = withBoardState(
    { ...hand },
    {
      deck: boardCardIds(hand, liveBoardState.deck).filter((id) => id !== discarded.id),
      graveyard: [discarded.id],
    },
  );
  const expanded = applyEffect(ready, { kind: 'heart-limit', amount: 999_900 });
  const filled = applyEffect(expanded, { kind: 'hearts', amount: 500_000 });
  const next = collectHearts(filled);
  const nextBook = next.deck.find(
    (card) => next.hand.includes(card.id) && card.token === 'bookmark',
  );
  expect(nextBook).toBeDefined();
  if (!nextBook) throw new Error('浮き輪を確保できませんでした。');
  expect(canActivateHandCollectionAbility(next, nextBook)).toBe(true);
  const nextStory = next.deck.find((card) => next.hand.includes(card.id) && card.token === 'story');
  expect(nextStory).toBeDefined();
  if (!nextStory) throw new Error('貝がらを確保できませんでした。');
  expect(canActivateHandCollectionAbility(next, nextStory)).toBe(true);
  expect(next.deck.some((card) => next.hand.includes(card.id) && card.token === 'clock')).toBe(
    true,
  );
  expect(next.deckBoard.deckOutCount).toBe(base.deckBoard.deckOutCount);
  expect(next.handCollectionActivationCounts[book.id]).toBe(1);
});
