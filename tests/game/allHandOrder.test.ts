import { cardCost } from '@akaakuhub/suku-sute-core/game/cards/cost';
import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { moodValue } from '@akaakuhub/suku-sute-core/game/projection';
import type { Card, Effect } from '@akaakuhub/suku-sute-core/game/model';
import { game, withHand } from './support/game';

function setup(sourceEffects: readonly Effect[], childEffects: readonly Effect[]) {
  const base = game('library');
  const appeal = base.deck[0]?.appeal;
  if (!appeal) throw new Error('確認用カードがありません。');
  const source: Card = {
    cardInstanceId: 'source',
    cardDatasId: 'source',
    name: '発動元',
    charactersId: 1021,
    unitIds: [1],
    tokenCardSeriesIds: [],
    costume: null,
    performer: 'nova',
    appeal,
    beatPoint: 1,
    skillMainEffect: 42,
    styleType: null,
    consumeAp: 1,
    effects: sourceEffects,
  };
  const child: Card = {
    ...source,
    cardInstanceId: 'child',
    cardDatasId: 'child',
    name: '子カード',
    charactersId: 1031,
    skillMainEffect: 14,
    effects: childEffects,
  };
  const deck = [source, child];
  const state = withHand(
    withBoardState(
      { ...base, deck, cardPool: deck, handCardStats: {}, ap: { ...base.ap, currentAp: 20 } },
      {},
      { ['source']: { skillUseAtBoardState: 3 }, ['child']: { skillUseAtBoardState: 3 } },
    ),
    [source.cardInstanceId, child.cardInstanceId],
  );
  return { state, source, child };
}

it('全手札使用の効果位置で子カードを発動し、その後の効果を先取りしない', () => {
  const { state } = setup(
    [{ kind: 'use-hand' }, { kind: 'mood', amount: 10 }],
    [
      {
        kind: 'branch',
        condition: { kind: 'mood-at-least', value: 5 },
        whenTrue: [{ kind: 'mood', amount: 1 }],
        whenFalse: [{ kind: 'mood', amount: 2 }],
      },
    ],
  );
  expect(moodValue(state)).toBe(0);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.cardUses.map((entry) => entry.card.cardInstanceId)).toEqual(['source', 'child']);
  expect(moodValue(used)).toBe(12);
});

it('子カードのコストに発動元の使用通知を先取りしない', () => {
  const { state, source, child } = setup([{ kind: 'use-hand' }], []);
  const changed = applyEffect(
    state,
    {
      kind: 'skill-cost-change',
      amount: 1,
      minimum: 0,
      maximum: 100,
      conditionType: 6,
      conditionId: source.charactersId,
    },
    child,
  );
  const used = act(changed, { type: 'card', index: 0 });
  expect(
    used.cardUses.find((entry) => entry.card.cardInstanceId === child.cardInstanceId)?.consumeAp,
  ).toBe(1);
});

it('全手札使用の子に全手札使用があっても各カードを1回ずつ発動する', () => {
  const { state, child } = setup([{ kind: 'use-hand' }], [{ kind: 'use-hand' }]);
  const last: Card = {
    ...child,
    cardInstanceId: 'last',
    cardDatasId: 'last',
    name: '最後のカード',
    effects: [{ kind: 'mood', amount: 1 }],
  };
  const deck = [...state.deck, last];
  const ready = withHand(
    withBoardState(
      { ...state, deck, cardPool: deck },
      {},
      { ['last']: { skillUseAtBoardState: 3 } },
    ),
    ['source', 'child', 'last'],
  );
  const used = act(ready, { type: 'card', index: 0 });
  expect(used.cardUses.map((entry) => entry.card.cardInstanceId)).toEqual([
    'source',
    'child',
    'last',
  ]);
  expect(moodValue(used)).toBe(1);
});

it('分岐先にある全手札使用は初期状態では無効で他の手札を発動しない', () => {
  const { state } = setup(
    [
      {
        kind: 'branch',
        condition: { kind: 'cards', zone: 'all', minimum: 1 },
        whenTrue: [{ kind: 'use-hand' }],
        whenFalse: [],
      },
    ],
    [{ kind: 'mood', amount: 1 }],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.cardUses.map((entry) => entry.card.cardInstanceId)).toEqual(['source']);
  expect(moodValue(used)).toBe(0);
});

it('一斉使用中の子カードはActionType42の合算コストではなく通常の個別コストを記録する', () => {
  const initial = game('library');
  const source = initial.deck.find((card) => card.cardInstanceId === 'library-ensemble');
  const template = initial.deck.find((card) => card.cardInstanceId === 'library-pages');
  if (!source || !template) throw new Error('確認用カードがありません。');
  const child = {
    ...template,
    effects: [{ kind: 'use-hand' as const, addAp: 7 }],
  };
  const state = withHand(
    {
      ...initial,
      deck: initial.deck.map((item) =>
        item.cardInstanceId === child.cardInstanceId ? child : item,
      ),
      cardPool: initial.deck.map((item) =>
        item.cardInstanceId === child.cardInstanceId ? child : item,
      ),
    },
    [source.cardInstanceId, child.cardInstanceId],
  );
  expect(cardCost(state, child)).toBeGreaterThan(child.consumeAp);
  expect(cardCost(state, child, true)).toBe(child.consumeAp);
  const used = act({ ...state, ap: { ...state.ap, currentAp: 100 } }, { type: 'card', index: 0 });
  expect(
    used.cardUses.find((item) => item.card.cardInstanceId === child.cardInstanceId)?.consumeAp,
  ).toBe(child.consumeAp);
});

it('全手札補充では使用元を保持し、使用スキルの抽選条件を引き継がない', () => {
  const { state, source, child } = setup([{ kind: 'use-hand' }], []);
  const parent = { ...source, skillIcon: 42 };
  const matched: Card = {
    ...child,
    drawRules: [{ condition: { kind: 'icon', value: 42 }, negated: true, weight: 0 }],
  };
  const fresh: Card = {
    ...child,
    cardInstanceId: 'fresh',
    cardDatasId: 'fresh',
    drawRules: [{ condition: { kind: 'icon', value: 42 }, negated: false, weight: 0 }],
  };
  const deck = [parent, matched, fresh];
  const ready = withHand(withBoardState({ ...state, deck, cardPool: deck }, {}), [
    'source',
    'child',
  ]);
  const used = act(ready, { type: 'card', index: 0 });
  expect(used.hand[0]).toBe('fresh');
  expect(used.usedCard).toBe(parent);
  expect(used.lastUsedSkillIcon).toBeNull();
  expect(used.tokenCardDeck.isAllHandSkill).toBe(false);
});

it('子カードの検索を全手札補充に使用し、親の完了時に使い残しを消す', () => {
  const { state } = setup(
    [{ kind: 'use-hand' }],
    [{ kind: 'search', scope: 'skill', target: { kind: 'member', member: 1031 }, count: 12 }],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.hand).toContain('child');
  expect(used.deckBoard.skillCardSearchParams).toEqual([]);
  expect(used.deckActions.queue).toEqual([]);
});

it('通常の親カードも補充終了後に使い残した検索を消す', () => {
  const { state } = setup(
    [{ kind: 'search', scope: 'grade', target: { kind: 'member', member: 1031 }, count: 12 }],
    [],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.hand).toContain('child');
  expect(used.deckBoard.gradeCardSearchParams).toEqual([]);
  expect(used.deckActions.queue).toEqual([]);
});
