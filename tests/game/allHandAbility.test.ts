import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { moodValue } from '@akaakuhub/suku-sute-core/game/projection';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { game, withHand } from './support/game';

it('ActionType42は子カードのAbility894を起動する', () => {
  const initial = game('library');
  const source = initial.deck.find((item) => item.id === 'library-ensemble');
  const child = initial.deck.find((item) => item.id === 'library-pages');
  if (!source || !child) throw new Error('確認対象のカードがありません。');
  const updatedSource = {
    ...source,
    effects: [{ kind: 'use-hand' as const }],
    ability894Effects: [{ kind: 'mood' as const, amount: 1 }],
  };
  const updatedChild = {
    ...child,
    effects: [{ kind: 'tokens' as const, token: 'story' as const, count: 1 }],
    ability894Effects: [{ kind: 'tokens' as const, token: 'story' as const, count: 1 }],
  };
  const deck = initial.deck.map((item) =>
    item.id === source.id ? updatedSource : item.id === child.id ? updatedChild : item,
  );
  const state = withHand({ ...initial, deck, cardPool: deck, energy: 100 }, [source.id, child.id]);
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(2);
  expect(moodValue(used)).toBe(1);
  expect(used.deck.filter((item) => item.token === 'story')).toHaveLength(
    initial.deck.filter((item) => item.token === 'story').length + 2,
  );
});

it('ActionType42は参照実装と同じ順に手札誘発を先に実行してからAbility894を評価する', () => {
  const initial = game('library');
  const source = initial.deck.find((item) => item.id === 'library-ensemble');
  const inducer = initial.deck.find((item) => item.id === 'library-pages');
  if (!source || !inducer) throw new Error('確認対象のカードがありません。');
  const updatedSource = {
    ...source,
    effects: [{ kind: 'use-hand' as const }],
    ability894Effects: [
      {
        kind: 'branch' as const,
        condition: { kind: 'mood-at-least' as const, value: moodValue(initial) + 1 },
        whenTrue: [{ kind: 'hearts' as const, amount: 1 }],
        whenFalse: [],
      },
    ],
  };
  const updatedInducer = {
    ...inducer,
    effects: [],
    handInducers: [
      {
        sourceEffectId: 'test-inducer',
        trigger: { kind: 'any-skill' as const },
        effects: [{ kind: 'mood' as const, amount: 1 }],
      },
    ],
  };
  const deck = initial.deck.map((item) =>
    item.id === source.id ? updatedSource : item.id === inducer.id ? updatedInducer : item,
  );
  const state = withHand(
    {
      ...initial,
      deck,
      cardPool: deck,
      handEffectCardIds: [inducer.id],
      energy: 100,
    },
    [source.id, inducer.id],
  );
  const used = act(state, { type: 'card', index: 0 });
  expect(used.stats.cardsUsed).toBe(2);
  expect(heartCount(used)).toBe(1);
});
