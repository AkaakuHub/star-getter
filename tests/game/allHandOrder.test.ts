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
    id: 'source',
    name: '発動元',
    member: 1021,
    unit: 1,
    costume: null,
    performer: 'nova',
    appeal,
    beatPoint: 1,
    mainEffect: 42,
    cost: 1,
    effects: sourceEffects,
  };
  const child: Card = {
    ...source,
    id: 'child',
    name: '子カード',
    member: 1031,
    mainEffect: 14,
    effects: childEffects,
  };
  const deck = [source, child];
  const state = withHand(
    {
      ...base,
      deck,
      cardPool: deck,
      handCardStats: {},
      cardSkillUseStates: {
        source: { skillUseAtBoardState: 3 },
        child: { skillUseAtBoardState: 3 },
      },
      ap: { ...base.ap, currentAp: 20 },
    },
    [source.id, child.id],
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
  expect(used.cardUses.map((entry) => entry.card.id)).toEqual(['source', 'child']);
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
      conditionId: source.member,
    },
    child,
  );
  const used = act(changed, { type: 'card', index: 0 });
  expect(used.cardUses.find((entry) => entry.card.id === child.id)?.cost).toBe(1);
});

it('全手札使用の子に全手札使用があっても各カードを1回ずつ発動する', () => {
  const { state, child } = setup([{ kind: 'use-hand' }], [{ kind: 'use-hand' }]);
  const last: Card = {
    ...child,
    id: 'last',
    name: '最後のカード',
    effects: [{ kind: 'mood', amount: 1 }],
  };
  const deck = [...state.deck, last];
  const ready = withHand(
    {
      ...state,
      deck,
      cardPool: deck,
      cardSkillUseStates: { ...state.cardSkillUseStates, last: { skillUseAtBoardState: 3 } },
    },
    ['source', 'child', 'last'],
  );
  const used = act(ready, { type: 'card', index: 0 });
  expect(used.cardUses.map((entry) => entry.card.id)).toEqual(['source', 'child', 'last']);
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
  expect(used.cardUses.map((entry) => entry.card.id)).toEqual(['source']);
  expect(moodValue(used)).toBe(0);
});
