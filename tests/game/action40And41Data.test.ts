import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType40/41の詳細とデッキ上限・子Effectを接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 40 as const,
              skillEffectId: 40_001n,
              destination: 'effects' as const,
              details: [],
              deckCardMax: null,
            },
            {
              actionType: 41 as const,
              skillEffectId: 41_001n,
              destination: 'effects' as const,
              details: [],
              deckCardMax: 12,
              childEffects: [],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((item) => item.kind === 'skill-cooldown')).toMatchObject({
    kind: 'skill-cooldown',
    deckCardMax: null,
  });
  expect(compiled?.effects.find((item) => item.kind === 'induce-skill-effect')).toMatchObject({
    kind: 'induce-skill-effect',
    deckCardMax: 12,
    effects: [],
  });
});
