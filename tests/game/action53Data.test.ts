import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType53は明示された曲・発動元・TokenCardデータでEffectを生成する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 53 as const,
              skillEffectId: 53_001n,
              destination: 'effects' as const,
              details: [],
              musicGenerationsId: 1,
              sourceSkillLevel: 1,
              sourceSpecialAppealSkillLevel: 1,
              memberOrder: [],
              tokenCardSets: [],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((item) => item.kind === 'special-appeal-token')).toMatchObject({
    kind: 'special-appeal-token',
    musicGenerationsId: 1,
    sourceSkillLevel: 1,
    tokenCardSets: [],
  });
});
