import { expect, it } from 'vite-plus/test';
import { act } from '../../src/domain/game/actions';
import { game } from './support/game';

it('Action13は手札を引き直し、使用カードの補充を抑止する', () => {
  const initial = game('library');
  const sourceId = initial.hand[0];
  if (!sourceId) throw new Error('使用するカードが手札にありません。');
  const deck = initial.deck.map((card) =>
    card.id === sourceId
      ? {
          ...card,
          effects: [{ kind: 'reshuffle-skill' as const, recoveryType: 1, stashType: 1 }],
        }
      : card,
  );
  const used = act(
    { ...initial, phase: 'playing', energy: 100, deck, cardPool: deck },
    { type: 'card', index: 0 },
  );
  expect(used.hand).toHaveLength(initial.hand.length - 1);
  expect(used.discard).toContain(sourceId);
});
