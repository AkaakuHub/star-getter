import { createLiveOnDrawInduceEffect } from '@akaakuhub/suku-sute-core/runtime/cards/onDrawInduceEffect';
import { boardCardIds } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { liveBoardState } from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { withBoardState } from './support/board';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { expect, it } from 'vite-plus/test';
import { fillHand, shuffleHand } from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { game, withHand, withHandTarget } from './support/game';

for (const recoverDiscard of [false, true]) {
  for (const destination of ['draw', 'discard'] as const) {
    it(`引き直しの捨て札回収${recoverDiscard}と手札移動先${destination}を独立して扱う`, () => {
      const prepared = withHand(game('library'), ['class']);
      const discarded = 'library-pages';
      const initial = withBoardState(
        { ...prepared },
        {
          deck: boardCardIds(prepared, liveBoardState.deck).filter((id) => id !== discarded),
          graveyard: [discarded],
        },
      );
      const next = shuffleHand(initial, { recoverDiscard, destination });
      expect(next.hand).toEqual([]);
      expect(next.randomSeed).toBe(initial.randomSeed);
      expect(boardCardIds(next, liveBoardState.deck).includes('class')).toBe(
        destination === 'draw',
      );
      expect(boardCardIds(next, liveBoardState.graveyard).includes('class')).toBe(
        destination === 'discard',
      );
      expect(boardCardIds(next, liveBoardState.deck).includes(discarded)).toBe(recoverDiscard);
      expect(boardCardIds(next, liveBoardState.graveyard).includes(discarded)).toBe(
        !recoverDiscard,
      );
      expect(
        [
          ...boardCardIds(next, liveBoardState.deck),
          ...boardCardIds(next, liveBoardState.graveyard),
        ].sort(),
      ).toEqual(
        [
          ...boardCardIds(initial, liveBoardState.deck),
          ...initial.hand,
          ...boardCardIds(initial, liveBoardState.graveyard),
        ].sort(),
      );
    });
  }
}

it('一斉使用内のリセットシャッフルは発動した本人を戻さず、他のカードを山札へ戻す', () => {
  const state = withHand(
    {
      ...addTokens(game('library'), 'story', 30),
      ap: { ...addTokens(game('library'), 'story', 30).ap, currentAp: 100, maxAp: 100 },
    },
    ['aurora-ensemble', 'class'],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed - state.stats.cardsUsed).toBe(2);
  expect(boardCardIds(used, liveBoardState.graveyard)).toContain('class');
  expect(used.hand).not.toContain('class');
  expect(boardCardIds(used, liveBoardState.deck)).toContain('aurora-ensemble');
  expect(boardCardIds(used, liveBoardState.graveyard)).not.toContain('aurora-ensemble');
});

it('一斉使用内の通常リシャッフルでは使用したカードを捨て札へ移す', () => {
  const state = withHand(
    {
      ...addTokens(game(), 'story', 30),
      ap: { ...addTokens(game(), 'story', 30).ap, currentAp: 100, maxAp: 100 },
    },
    ['aurora-ensemble', 'frost-echo'],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed - state.stats.cardsUsed).toBe(2);
  for (const id of ['aurora-ensemble', 'frost-echo']) {
    expect(boardCardIds(used, liveBoardState.graveyard)).toContain(id);
    expect(used.hand).not.toContain(id);
    expect(boardCardIds(used, liveBoardState.deck)).not.toContain(id);
  }
});

it('全枚数の補充を終えてからドロー能力を順番に実行し、途中の上限減少で抽選を打ち切らない', () => {
  let state = addTokens(game(), 'shadow', 1);
  const ids = [
    'horizon',
    'library-ensemble',
    'frost-echo',
    'frost-pulse',
    'rain-preparation',
    'perennial',
    'class',
  ];
  const deck = state.deck
    .filter((card) => ids.includes(card.cardInstanceId) || card.token === 'shadow')
    .map((card) => ({
      ...card,
      drawEffects: [{ kind: 'amplify' as const, percent: 1 }],
      ...(card.token === 'shadow'
        ? {
            onDrawInduceEffects: [
              createLiveOnDrawInduceEffect('handShuffle.test:1', {
                probabilityType: 1,
                probabilityValue: 0,
                conditionType: 4,
                conditionValue: 0,
                conditionNotFlag: 2,
              }),
            ],
          }
        : {}),
    }));
  state = withBoardState(
    {
      ...state,
      deck,
      cardPool: deck,
      handEffectCardIds: [],
      tokenCardDeck: withHandTarget(state, 8).tokenCardDeck,
      amplification: 100,
      deckDrawContext: {
        currentDrawType: 1 as const,
        usedCard: { charactersId: 0, unitIds: [2], skillMainEffect: null },
        usedSkill: null,
      },
    },
    { hand: [], deck: deck.map((card) => card.cardInstanceId), graveyard: [] },
  );
  const drawn = fillHand(state);
  expect(drawn.hand).toHaveLength(7);
  expect(drawn.amplification).toBe(108);
});
