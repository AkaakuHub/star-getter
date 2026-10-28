import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import type { CardSkillVariantMaster } from '@akaakuhub/suku-sute-core/game/cards/cardTypes';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';

const cardSkillVariants: readonly CardSkillVariantMaster[] = [
  {
    skillType: 2,
    seriesId: 42,
    skillLevel: 4,
    specialAppealSkillLevel: 0,
    skillSkillLevel: 4,
    seriesMainEffect: 1,
    seriesSkillIcon: 5,
    variant: { consumeAp: 3, effects: [{ kind: 'ap', amount: 2 }], skillIcon: 5, special: null },
  },
  {
    skillType: 3,
    seriesId: 43,
    skillLevel: 1,
    specialAppealSkillLevel: 0,
    skillSkillLevel: 4,
    seriesMainEffect: 2,
    seriesSkillIcon: 6,
    variant: {
      modeEffects: [],
      ability893Effects: [{ kind: 'voltage-set', amount: 2 }],
      ability894Effects: [],
    },
  },
];

it('ActionType28は指定されたTokenCardテンプレートからEffectを生成する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
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
                {
                  id: 28_001_8n,
                  detailType: 'TOKEN_CARD_SERIES_ID',
                  value: 0n,
                  paramValues: [(1n << 32n) + 42n],
                },
              ],
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7, undefined, [], cardSkillVariants);
  const compiled = state.deck.find((card) => card.id === source.id);
  const effect = compiled?.effects.find((item) => item.kind === 'token-card');
  expect(effect).toMatchObject({
    kind: 'token-card',
    resourceId: 481,
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
    skill: {
      seriesId: 42,
      mainEffect: 1,
      skillIcon: 5,
      variant: { consumeAp: 3, effects: [{ kind: 'ap', amount: 2 }], skillIcon: 5, special: null },
    },
    ability: {
      seriesId: 43,
      mainEffect: 2,
      skillIcon: 6,
      variant: {
        modeEffects: [],
        ability893Effects: [{ kind: 'voltage-set', amount: 2 }],
        ability894Effects: [],
      },
    },
  });
  if (!compiled || !effect) throw new Error('TokenCard effectが解決されていません。');
  const generated = applyEffect(state, effect, compiled);
  const tokenCard = generated.deck.find((card) => card.tokenCard);
  expect(tokenCard).toMatchObject({
    name: '',
    costume: null,
    performer: null,
    charactersId: 0,
    unitIds: [],
    consumeAp: 3,
    style: 2,
    mood: 3,
    appeal: { smile: 0, pure: 0, cool: 0 },
    beatPoint: 0,
    mainEffect: 1,
    skillIcon: 5,
    tokenCardAbilitySeriesId: 43n,
    tokenSeriesIds: [42],
    effects: [{ kind: 'ap', amount: 2 }],
    ability893Effects: [{ kind: 'voltage-set', amount: 2 }],
  });
  expect(state.tokenCatalog).toHaveLength(0);
});
