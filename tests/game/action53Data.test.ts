import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType53は明示された曲・発動元・TokenCardデータでEffectを生成する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
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
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'special-appeal-token')).toMatchObject({
    kind: 'special-appeal-token',
    musicGenerationsId: 1,
    sourceSkillLevel: 1,
    tokenCardSets: [],
  });
});
