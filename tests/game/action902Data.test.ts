import { resolveLiveOnDrawInduceValues } from '@akaakuhub/suku-sute-core/runtime/cards/cardDraw';
import { createOnDrawInduceEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/onDrawInduce';
import { drawWeight } from '@akaakuhub/suku-sute-core/game/cards/drawLottery';
import { game } from './support/game';
import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType902の確率・条件・反転詳細を抽選ルールへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 902 as const,
              skillEffectId: 902n,
              details: [
                { id: 1n, detailType: 'ON_DRAW_INDUCE_PROBABILITY_TYPE', value: 3n },
                { id: 2n, detailType: 'ON_DRAW_INDUCE_PROBABILITY_NUM', value: 2500n },
                { id: 3n, detailType: 'ON_DRAW_INDUCE_CONDITION_TYPE', value: 5n },
                { id: 4n, detailType: 'ON_DRAW_INDUCE_CONDITION_NOT_FLAG', value: 2n },
                { id: 5n, detailType: 'ON_DRAW_INDUCE_CONDITION_VALUE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.onDrawInduceEffects?.map(resolveLiveOnDrawInduceValues)).toEqual([
    {
      probabilityType: 3,
      probabilityValue: 2500,
      conditionType: 5,
      conditionValue: 3,
      conditionNotFlag: 2,
    },
  ]);
});

it('条件2は表示アイコンや通常スキルではなく使用元のMainEffectを参照する', () => {
  const base = game();
  const original = base.deck[0];
  if (!original) throw new Error('カードがありません。');
  const source = { ...original, skillMainEffect: 42, skillIcon: 7 };
  const card = {
    ...original,
    onDrawInduceEffects: [
      createOnDrawInduceEffect({
        actionType: 902,
        skillEffectId: 902n,
        details: [
          { id: 1n, detailType: 'ON_DRAW_INDUCE_PROBABILITY_TYPE', value: 2n },
          { id: 2n, detailType: 'ON_DRAW_INDUCE_PROBABILITY_NUM', value: 0n },
          { id: 3n, detailType: 'ON_DRAW_INDUCE_CONDITION_TYPE', value: 2n },
          { id: 4n, detailType: 'ON_DRAW_INDUCE_CONDITION_VALUE', value: 42n },
          { id: 5n, detailType: 'ON_DRAW_INDUCE_CONDITION_NOT_FLAG', value: 1n },
        ],
      }),
    ],
  };
  expect(
    drawWeight(card, {
      ...base,
      deckDrawContext: {
        currentDrawType: 1,
        usedCard: source,
        usedSkill: { skillType: 2, skillMainEffect: 7 },
      },
    }),
  ).toBe(0);
  expect(
    drawWeight(card, {
      ...base,
      deckDrawContext: {
        currentDrawType: 1,
        usedCard: source,
        usedSkill: null,
      },
    }),
  ).toBe(0);
});
