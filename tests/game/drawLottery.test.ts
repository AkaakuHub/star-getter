import { boardCardIds } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { liveBoardState } from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { drawWeight } from '@akaakuhub/suku-sute-core/game/cards/drawLottery';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { createCardSearchEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/cardSearch';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { fillHand, fillHandToCount } from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { addTokens } from '@akaakuhub/suku-sute-core/game/cards/tokens';
import { game, withHand, withHandTarget } from './support/game';

it('生成した30枚の末尾順で固定せず、各ドローで乱数を進める', () => {
  let state = addTokens(game('library'), 'story', 30);
  state = withHand(withHandTarget(state, 8), []);
  const first = fillHand(state);
  expect(first.randomSeed).not.toBe(state.randomSeed);
  const stories = first.hand.filter((id) =>
    first.deck.some((card) => card.cardInstanceId === id && card.token === 'story'),
  );
  expect(stories.length).toBeGreaterThan(0);
  expect(stories).not.toEqual(
    state.deck
      .filter((card) => card.token === 'story')
      .slice(0, stories.length)
      .map((card) => card.cardInstanceId),
  );
});

it('条件一致時だけ対象を優先し、極光は開始時の優先を持たない', () => {
  const state = game();
  const source = (id: string) => {
    const card = state.deck.find((item) => item.cardInstanceId === id);
    if (!card) throw new Error('カードがありません。');
    return card;
  };
  const initial = { ...state, drawContext: 'initial' as const };
  const doll = {
    ...state,
    drawContext: 'skill' as const,
    usedCard: { charactersId: 1032, unitIds: [2] },
  };
  const cerise = { ...doll, usedCard: { charactersId: 1031, unitIds: [1] } };
  expect(drawWeight(source('aurora-ensemble'), initial)).toBe(10_000);
  expect(drawWeight(source('aurora-ensemble'), doll)).toBe(-1);
  expect(drawWeight(source('library-ensemble'), initial)).toBe(0);
  expect(drawWeight(source('library-ensemble'), doll)).toBe(0);
  expect(drawWeight(source('library-ensemble'), cerise)).toBe(-1);
  expect(drawWeight(source('frost-pulse'), doll)).toBe(-1);
  expect(drawWeight(source('frost-pulse'), cerise)).toBe(0);
  expect(drawWeight(source('camera'), cerise)).toBe(-1);
});

it('tokenと編成の検索を後入れ先出しにして交互の対象へ引く', () => {
  let state = withHand(addTokens(game('library'), 'clock', 2), []);
  state = { ...state, drawContext: 'skill', usedCard: { charactersId: 0, unitIds: [1] } };
  state = applyEffect(state, { kind: 'search-token', token: 'clock', count: 1 });
  state = applyEffect(state, { kind: 'search-unit', unit: 1, count: 1 });
  state = applyEffect(state, { kind: 'search-token', token: 'clock', count: 1 });
  state = applyEffect(state, { kind: 'search-unit', unit: 1, count: 1 });
  const drawn = fillHandToCount(state, 4);
  const hand = drawn.hand.map((id) => drawn.deck.find((card) => card.cardInstanceId === id));
  expect(hand.map((card) => card?.token ?? card?.unitIds[0])).toEqual([1, 'clock', 1, 'clock']);
  expect(drawn.deckBoard.gradeCardSearchParams).toHaveLength(0);
  expect(drawn.deckBoard.sectionCardSearchParams).toHaveLength(0);
  expect(drawn.deckBoard.skillCardSearchParams).toHaveLength(0);
});

it('検索先があるときは検索外の優先カードを先に引かない', () => {
  let state = withHand(addTokens(game('library'), 'clock', 2), []);
  state = { ...state, drawContext: 'skill', usedCard: { charactersId: 0, unitIds: [1] } };
  state = applyEffect(state, { kind: 'search-token', token: 'clock', count: 1 });
  const drawn = fillHandToCount(state, 1);
  expect(drawn.deck.find((card) => card.cardInstanceId === drawn.hand[0])?.token).toBe('clock');
});

it('グレード、パート、スキルの順に検索し、グレード検索は捨て札からも引く', () => {
  let state = withHand(addTokens(addTokens(game('library'), 'clock', 1), 'story', 1), []);
  const story = state.deck.find((card) => card.token === 'story');
  if (!story) throw new Error('追加カードがありません。');
  state = withBoardState(
    { ...state, drawContext: 'skill', usedCard: { charactersId: 1031, unitIds: [] } },
    {
      deck: boardCardIds(state, liveBoardState.deck).filter((id) => id !== story.cardInstanceId),
      graveyard: [story.cardInstanceId],
    },
  );
  state = applyEffect(state, {
    kind: 'search',
    scope: 'skill',
    target: { kind: 'token', token: 'clock' },
    count: 1,
  });
  state = applyEffect(state, {
    kind: 'search',
    scope: 'section',
    target: { kind: 'member', member: 1053 },
    count: 1,
  });
  state = applyEffect(state, {
    kind: 'search',
    scope: 'grade',
    target: { kind: 'token-series', seriesId: 42 },
    count: 1,
  });
  state = {
    ...state,
    deck: state.deck.map((card) =>
      card.cardInstanceId === story.cardInstanceId ? { ...card, tokenCardSeriesIds: [42] } : card,
    ),
  };
  const drawn = fillHandToCount(state, 3);
  expect(drawn.hand[0]).toBe(story.cardInstanceId);
  expect(boardCardIds(drawn, liveBoardState.graveyard)).not.toContain(story.cardInstanceId);
  expect(drawn.hand[1]).toBe('camera');
  expect(drawn.deck.find((card) => card.cardInstanceId === drawn.hand[2])?.token).toBe('clock');
  expect(drawn.deckBoard.gradeCardSearchParams).toHaveLength(0);
  expect(drawn.deckBoard.sectionCardSearchParams).toHaveLength(0);
  expect(drawn.deckBoard.skillCardSearchParams).toHaveLength(0);
});

it('検索条件に一致するカードがない階層は消費し、次の階層の検索を使う', () => {
  let state = withHand(addTokens(game('library'), 'clock', 1), []);
  state = { ...state, drawContext: 'initial' };
  state = applyEffect(state, {
    kind: 'search',
    scope: 'grade',
    target: { kind: 'main-effect', actionType: 987654 },
    count: 1,
  });
  state = applyEffect(state, {
    kind: 'search',
    scope: 'section',
    target: { kind: 'token', token: 'clock' },
    count: 1,
  });
  const drawn = fillHandToCount(state, 1);
  expect(drawn.deck.find((card) => card.cardInstanceId === drawn.hand[0])?.token).toBe('clock');
  expect(drawn.deckBoard.gradeCardSearchParams).toHaveLength(0);
  expect(drawn.deckBoard.sectionCardSearchParams).toHaveLength(0);
  expect(drawn.deckBoard.skillCardSearchParams).toHaveLength(0);
});

it('スキル検索はアイコンではなくカードのMainEffectを照合する', () => {
  const initial = withHand(game(), []);
  const state = withBoardState(
    {
      ...initial,
      deck: initial.deck.map((card) =>
        card.cardInstanceId === 'camera'
          ? { ...card, skillMainEffect: 987654, skillIcon: 1, drawRules: [] }
          : card.cardInstanceId === 'perennial'
            ? { ...card, skillMainEffect: 12, skillIcon: 987654, drawRules: [] }
            : card,
      ),
      drawContext: 'initial' as const,
    },
    { deck: ['camera', 'perennial'] },
  );
  const searching = applyEffect(
    state,
    createCardSearchEffect({
      skillEffectId: 15n,
      details: [
        { id: 1n, detailType: 'CARD_SEARCH_TYPE', value: 1n },
        { id: 2n, detailType: 'CARD_SEARCH_ID', value: 987654n },
      ],
    }),
  );
  expect(fillHandToCount(searching, 1).hand).toEqual(['camera']);
});

it('解除キーが一致する未消費の検索指定を除去する', () => {
  let state = applyEffect(withHand(game(), []), {
    kind: 'search',
    scope: 'grade',
    target: { kind: 'member', member: 1053 },
    count: 1,
    deactivationKey: 'search-key',
  });
  state = act(state, { type: 'deactivate-search', deactivationKey: 'search-key' });
  expect(state.deckBoard.gradeCardSearchParams).toEqual([]);
});

it('山札に禁止カードしか残っていなければ捨て札を戻してから優先抽選する', () => {
  const initial = withHand(game('library'), ['class']);
  const state = withBoardState(
    { ...initial, drawContext: 'shuffle' as const },
    {
      deck: ['library-ensemble'],
      graveyard: initial.deck
        .filter((card) => !['class', 'library-ensemble'].includes(card.cardInstanceId))
        .map((card) => card.cardInstanceId),
    },
  );
  const drawn = fillHandToCount(state, 2);
  expect(drawn.hand).toContain('aurora-ensemble');
  expect(drawn.hand).not.toContain('library-ensemble');
  expect(drawn.deckBoard.deckOutCount).toBe(state.deckBoard.deckOutCount + 1);
  expect(boardCardIds(drawn, liveBoardState.graveyard)).toEqual([]);
});
