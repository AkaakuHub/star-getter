import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType904の子効果IDを手札永続効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const child = { kind: 'ap' as const, amount: 2 };
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 904 as const,
              details: [{ id: 90411n, detailType: 'HAND_PERMANENT_EFFECT_ID1', value: 0n }],
              childEffects: [{ ...child, skillEffectId: 90411n }],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.handPermanentEffects).toEqual([{ ...child, skillEffectId: 90411n }]);
});
