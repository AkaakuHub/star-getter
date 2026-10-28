import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import {
  notifyHandHeartCollect,
  notifyHandSkillUse,
} from '@akaakuhub/suku-sute-core/game/cards/handInduce';
import { handInducerStateKey } from '@akaakuhub/suku-sute-core/game/cards/handInducer';
import { withHand } from './support/game';

it('ActionType903の複数の条件・子効果・回数設定を手札誘発へ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 903 as const,
              skillEffectId: 9031n,
              details: [
                { id: 1n, detailType: 'HAND_INDUCE_TYPE', value: 1n },
                {
                  id: 2n,
                  detailType: 'HAND_INDUCE_TYPE_VALUE',
                  value: BigInt(source.charactersId),
                },
                { id: 3n, detailType: 'HAND_INDUCE_LIMIT_NUM', value: 2n },
              ],
              effects: [{ kind: 'mood' as const, amount: 1 }],
            },
            {
              actionType: 903 as const,
              skillEffectId: 9032n,
              details: [
                { id: 4n, detailType: 'HAND_INDUCE_TYPE', value: 5n },
                { id: 5n, detailType: 'HAND_INDUCE_TYPE_VALUE', value: 2n },
                { id: 6n, detailType: 'HAND_INDUCE_LIMIT_NUM', value: 1n },
                { id: 7n, detailType: 'HAND_INDUCE_LIMIT_MEMOLY_TYPE', value: 2n },
              ],
              effects: [{ kind: 'ap' as const, amount: 1 }],
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7);
  const compiled = state.deck.find((card) => card.id === source.id);
  expect(compiled?.handInducers).toEqual([
    {
      sourceEffectId: '9031',
      trigger: { kind: 'member', member: BigInt(source.charactersId) },
      effects: [{ kind: 'mood', amount: 1 }],
      limit: 2n,
      limitMemory: 'reset',
    },
    {
      sourceEffectId: '9032',
      trigger: { kind: 'heart-quantity-count', count: 2n },
      effects: [{ kind: 'ap', amount: 1 }],
      limit: 1n,
      limitMemory: 'retain',
    },
  ]);
  if (!compiled) throw new Error('手札誘発カードがありません。');
  const initial = withHand(state, [source.id]);
  const memberTriggered = notifyHandSkillUse(initial, compiled, applyEffect);
  expect(memberTriggered.handUseActivationCounts[handInducerStateKey(source.id, '9031')]).toBe(1);
  const firstHeart = notifyHandHeartCollect(memberTriggered, 1, applyEffect);
  expect(
    firstHeart.handUseActivationCounts[handInducerStateKey(source.id, '9032')],
  ).toBeUndefined();
  const secondHeart = notifyHandHeartCollect(firstHeart, 1, applyEffect);
  expect(secondHeart.handUseActivationCounts[handInducerStateKey(source.id, '9032')]).toBe(1);
  expect(secondHeart.ap.currentAp).toBe(memberTriggered.ap.currentAp + 1);
});
