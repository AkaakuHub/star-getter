import { createLiveOnDrawInduceEffect } from '@akaakuhub/suku-sute-core/runtime/cards/onDrawInduceEffect';
import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { handCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import { switchTokenDeck } from '@akaakuhub/suku-sute-core/game/effects/tokenDeckSplit';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import {
  createCardDeckBoard,
  currentDeckCardIds,
} from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { createLiveTokenCardDeckState } from '@akaakuhub/suku-sute-core/runtime/cards/tokenCardDeck';
import { rules, type Card } from '@akaakuhub/suku-sute-core/game/model';
import { game } from './support/game';

function setup() {
  const base = game('genesis');
  const template = base.deck[0];
  if (!template) throw new Error('カードがありません。');
  const main: Card = {
    ...template,
    cardInstanceId: 'main',
    tokenCardSeriesIds: [],
    onDrawInduceEffects: [],
    drawAbility: undefined,
  };
  const sub: readonly Card[] = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'].map(
    (id, index) => ({
      ...template,
      cardInstanceId: id,
      tokenCardSeriesIds: [42],
      onDrawInduceEffects: [
        createLiveOnDrawInduceEffect('tokenDeckPartition.test:1', {
          probabilityType: 2,
          probabilityValue: 0,
          conditionType: 4,
          conditionValue: 0,
          conditionNotFlag: index !== 0 ? 2 : 1,
        }),
      ],
      drawAbility: undefined,
      drawEffects: [{ kind: 'ap', amount: 9 }],
      ability893Effects: [{ kind: 'ap', amount: 7 }],
    }),
  );
  const deck = [main, ...sub];
  return {
    ...base,
    deck,
    cardPool: deck,
    hand: [main.cardInstanceId],
    deckBoard: createCardDeckBoard(deck, [main.cardInstanceId]),
    tokenCardDeck: createLiveTokenCardDeckState<string>(rules.handSize),
    handEffectCardIds: [main.cardInstanceId],
    activeHandPermanentCardIds: [],
    handCardStats: {},
  };
}

function split() {
  return applyEffect(setup(), {
    kind: 'token-deck-split',
    seriesIds: [42n],
    duration: { kind: 'stage', value: 0 },
  });
}

it('sub先行抽選はmainの実手札数でなく保存した目標枚数を使い、開始時の抽選条件を使わない', () => {
  const base = setup();
  const prepared = applyEffect(base, {
    kind: 'search',
    scope: 'skill',
    target: { kind: 'token-series', seriesId: 42 },
    count: 1,
  });
  const result = applyEffect(prepared, {
    kind: 'token-deck-split',
    seriesIds: [42n],
    duration: { kind: 'stage', value: 0 },
  });
  const hand = result.tokenDeckSplit?.sub.hand;
  expect(result.hand).toEqual(['main']);
  expect(hand).toHaveLength(rules.handSize);
  expect(hand?.[0]).toBe('first');
  expect(hand?.every((id) => result.handCardStats[id]?.isActive === false)).toBe(true);
  expect(result.ap.currentAp).toBe(base.ap.currentAp);
  expect(hand?.map((id) => result.handHeartCollectCounts[id])).toEqual([0, 0, 0, 0, 0]);
  expect(result.deckBoard.skillCardSearchParams).toEqual([]);
  expect(result.deckDrawContext.usedCard).toBeNull();
});

it('生成したカードの所属と現在の編成参照が同じ共通状態を使う', () => {
  const initial = split();
  const template = initial.deck[0];
  if (!template) throw new Error('カードがありません。');
  const matching = addTokens(
    { ...initial, tokenCatalog: [{ ...template, token: 'story', tokenCardSeriesIds: [42] }] },
    'story',
    1,
  );
  const addedSub = matching.deck.at(-1);
  if (!addedSub) throw new Error('追加カードがありません。');
  expect(matching.tokenCardDeck.subDeckCardInstanceIds).toContain(addedSub.cardInstanceId);
  expect(currentDeckCardIds(matching)).not.toContain(addedSub.cardInstanceId);
  const sub = act(matching, { type: 'switch-token-deck' });
  const different = addTokens(
    { ...sub, tokenCatalog: [{ ...template, token: 'story', tokenCardSeriesIds: [9] }] },
    'story',
    1,
  );
  const addedMain = different.deck.at(-1);
  if (!addedMain) throw new Error('追加カードがありません。');
  expect(different.tokenCardDeck.subDeckCardInstanceIds).not.toContain(addedMain.cardInstanceId);
  expect(currentDeckCardIds(different)).not.toContain(addedMain.cardInstanceId);
  const main = act(different, { type: 'switch-token-deck' });
  expect(currentDeckCardIds(main)).toContain(addedMain.cardInstanceId);
});

it('既存のsub手札がある切替でも再読み込み通知を処理する', () => {
  const initial = split();
  const prepared = {
    ...initial,
    deckBoard: { ...initial.deckBoard, deckOutCount: 1 },
    track: { ...initial.track, afterDeckReloadEffects: [{ kind: 'ap' as const, amount: 2 }] },
  };
  const result = act(prepared, { type: 'switch-token-deck' });
  expect(result.hand.length).toBeGreaterThan(0);
  expect(result.afterDeckReloadEvents).toBe(initial.afterDeckReloadEvents + 1);
  expect(result.deckBoard.deckOutCount).toBe(0);
  expect(result.ap.currentAp).toBe(initial.ap.currentAp + 2);
});

it('切替先の能力は枚数調整前の目標を参照し、その変更後に手札を調整する', () => {
  const base = split();
  const variant = {
    modeEffects: [{ kind: 'ap' as const, amount: 1 }],
    ability893Effects: [],
    ability894Effects: [],
  };
  const initial = {
    ...base,
    deck: base.deck.map((card) =>
      card.cardInstanceId === 'first'
        ? { ...card, modeAbilityChanges: { modeId: 901, off: variant, on: variant } }
        : card,
    ),
  };
  const observed: number[] = [];
  const result = switchTokenDeck(initial, (state) => {
    observed.push(state.tokenCardDeck.handTargetCounts.current);
    return {
      ...state,
      tokenCardDeck: {
        ...state.tokenCardDeck,
        handTargetCounts: { ...state.tokenCardDeck.handTargetCounts, current: 3 },
      },
    };
  });
  expect(observed).toEqual([rules.handSize]);
  expect(result.hand).toHaveLength(3);
  expect(result.tokenCardDeck.handTargetCounts).toEqual({
    current: 3,
    main: rules.handSize,
    sub: rules.handSize,
  });
});

it('実際の手札数変更効果とデッキ切替が同じ現在目標を参照する', () => {
  const initial = split();
  const changed = applyEffect(initial, handCardCountEffect(-1, 3, 0n));
  expect(changed.tokenCardDeck.handTargetCounts.current).toBe(4);
  const sub = act(changed, { type: 'switch-token-deck' });
  expect(sub.hand).toHaveLength(4);
  expect(sub.tokenCardDeck.handTargetCounts).toEqual({ current: 4, main: 4, sub: 5 });
  const main = act(sub, { type: 'switch-token-deck' });
  expect(main.hand).toEqual(['main']);
  expect(main.tokenCardDeck.handTargetCounts).toEqual({ current: 4, main: 4, sub: 4 });
});
