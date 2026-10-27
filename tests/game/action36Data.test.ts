import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import type { CardSkillVariantMaster } from '@akaakuhub/suku-sute-core/game/cards/cardTypes';

const cardSkillVariants: readonly CardSkillVariantMaster[] = [
  {
    skillType: 2,
    seriesId: 200,
    skillLevel: 1,
    specialAppealSkillLevel: 1,
    skillSkillLevel: 1,
    seriesMainEffect: 0,
    seriesSkillIcon: 20,
    variant: { cost: 2, effects: [], skillIcon: 20, special: null },
  },
  {
    skillType: 2,
    seriesId: 201,
    skillLevel: 1,
    specialAppealSkillLevel: 1,
    skillSkillLevel: 1,
    seriesMainEffect: 0,
    seriesSkillIcon: 21,
    variant: { cost: 3, effects: [], skillIcon: 21, special: null },
  },
  {
    skillType: 3,
    seriesId: 210,
    skillLevel: 1,
    specialAppealSkillLevel: 1,
    skillSkillLevel: 1,
    seriesMainEffect: 0,
    seriesSkillIcon: 22,
    variant: {
      modeEffects: [],
      ability893Effects: [{ kind: 'voltage-set', amount: 1 }],
      ability894Effects: [],
    },
  },
  {
    skillType: 3,
    seriesId: 211,
    skillLevel: 1,
    specialAppealSkillLevel: 1,
    skillSkillLevel: 1,
    seriesMainEffect: 0,
    seriesSkillIcon: 23,
    variant: {
      modeEffects: [],
      ability893Effects: [{ kind: 'voltage-set', amount: 2 }],
      ability894Effects: [],
    },
  },
];

it('ActionType36のModeIdと詳細構成をカードへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 36 as const,
              details: [
                { id: 1n, detailType: 'MODE_SKILL_CHANGE_MODE_ID', value: 100n },
                {
                  id: 2n,
                  detailType: 'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_1',
                  value: 4_294_967_496n,
                },
                {
                  id: 3n,
                  detailType: 'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_2',
                  value: 4_294_967_497n,
                },
              ],
              skillType: 2,
              skillLevel: 1,
              specialAppealSkillLevel: 1,
              skillSkillLevel: 1,
              modeParameterChanges: { modeId: 100, off: [], on: [] },
            },
            {
              actionType: 36 as const,
              details: [
                { id: 4n, detailType: 'MODE_SKILL_CHANGE_MODE_ID', value: 101n },
                {
                  id: 5n,
                  detailType: 'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_1',
                  value: 210n,
                },
                {
                  id: 6n,
                  detailType: 'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_2',
                  value: 211n,
                },
              ],
              skillType: 3,
              skillLevel: 1,
              specialAppealSkillLevel: 1,
              skillSkillLevel: 1,
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7, undefined, undefined, cardSkillVariants);
  const compiled = state.deck.find((card) => card.id === source.id);
  expect(compiled?.modeIds).toContain(100);
  expect(compiled?.modeIds).toContain(101);
  expect(compiled?.modeParameterChanges?.modeId).toBe(100);
  expect(compiled?.modeSkillChanges).toMatchObject({
    modeId: 100,
    off: { cost: 2, skillIcon: 20 },
    on: { cost: 3, skillIcon: 21 },
  });
  expect(state.modes.entries.some((mode) => mode.id === 100)).toBe(true);
  expect(compiled?.modeAbilityChanges).toMatchObject({
    modeId: 101,
    off: { ability893Effects: [{ kind: 'voltage-set', amount: 1 }] },
    on: { ability893Effects: [{ kind: 'voltage-set', amount: 2 }] },
  });
});

it('ActionType36は系列IDに一致するMaster variantがない場合に失敗する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 36 as const,
              details: [
                { id: 1n, detailType: 'MODE_SKILL_CHANGE_MODE_ID', value: 1n },
                {
                  id: 2n,
                  detailType: 'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_1',
                  value: 20n,
                },
                {
                  id: 3n,
                  detailType: 'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_2',
                  value: 21n,
                },
              ],
              skillType: 2,
              skillLevel: 1,
              specialAppealSkillLevel: 1,
              skillSkillLevel: 1,
            },
          ],
        }
      : card,
  );
  expect(() =>
    createGame(track, deck, 7, undefined, undefined, [
      {
        skillType: 2,
        seriesId: 20,
        skillLevel: 1,
        specialAppealSkillLevel: 1,
        skillSkillLevel: 1,
        seriesMainEffect: 0,
        seriesSkillIcon: 20,
        variant: { cost: 2, effects: [], skillIcon: 20, special: null },
      },
    ]),
  ).toThrow('モード切替スキル系列Masterを一意に解決できません。');
});
