import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType28は指定されたTokenCardテンプレートからEffectを生成する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 28 as const,
              skillEffectId: 28_001n,
              skillType: 3,
              skillLevel: 2,
              specialAppealSkillLevel: 3,
              skillSkillLevel: 4,
              destination: 'effects' as const,
              details: [
                { id: 28_001_1n, detailType: 'TOKEN_CARD_CARD_COUNT', value: 2n },
                { id: 28_001_2n, detailType: 'TOKEN_CARD_RESOURCE_ID', value: 481n },
                { id: 28_001_3n, detailType: 'TOKEN_CARD_STYLE_TYPE', value: 2n },
                { id: 28_001_4n, detailType: 'TOKEN_CARD_MOOD_TYPE', value: 3n },
                {
                  id: 28_001_5n,
                  detailType: 'TOKEN_CARD_SKILL_CARD_SKILL_SERIES_ID',
                  value: 42n,
                },
                {
                  id: 28_001_6n,
                  detailType: 'TOKEN_CARD_ABILITY_CARD_SKILL_SERIES_ID',
                  value: 43n,
                },
                { id: 28_001_7n, detailType: 'TOKEN_CARD_ABILITY_LEVEL_REFERENCE', value: 2n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'token-card')).toMatchObject({
    kind: 'token-card',
    templateId: '481',
    count: 2n,
    style: 2,
    mood: 3,
    skillSeriesId: 42,
    skillLevel: 4,
    abilitySeriesId: 43,
    abilityLevel: 1,
    sourceSkillType: 3,
    sourceSkillLevel: 2,
    sourceSpecialAppealSkillLevel: 3,
    sourceSkillSkillLevel: 4,
  });
});
