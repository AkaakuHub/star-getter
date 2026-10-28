import { expect, it } from 'vite-plus/test';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { createReshuffleEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/reshuffle';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { game } from './support/game';

it('Action13は手札を引き直し、使用カードの補充を抑止する', () => {
  const initial = game('library');
  const sourceId = initial.hand[0];
  if (!sourceId) throw new Error('使用するカードが手札にありません。');
  const deck = initial.deck.map((card) =>
    card.id === sourceId
      ? {
          ...card,
          effects: [{ kind: 'reshuffle-skill' as const, recoveryType: 1n, stashType: 1n }],
        }
      : card,
  );
  const used = act(
    { ...initial, phase: 'playing', currentAp: 100, deck, cardPool: deck },
    { type: 'card', index: 0 },
  );
  expect(used.hand).toHaveLength(initial.hand.length - 1);
  expect(used.discard).toContain(sourceId);
});

it('ActionType13はlong値が2³²+1なら種別1として扱わない', () => {
  const initial = game();
  const source = initial.deck[0];
  if (!source) throw new Error('使用するカードがありません。');
  const effect = createReshuffleEffect({
    skillEffectId: 13n,
    details: [
      { id: 1n, detailType: 'RESHUFFLE_RECOVERY_TYPE', value: (1n << 32n) + 1n },
      { id: 2n, detailType: 'RESHUFFLE_STASH_TYPE', value: (1n << 32n) + 1n },
    ],
  });

  const activated = applyEffect(initial, effect, source);
  expect(activated.deckActions.shuffles[0]?.options).toEqual({
    recoverDiscard: false,
    destination: 'discard',
  });
});
