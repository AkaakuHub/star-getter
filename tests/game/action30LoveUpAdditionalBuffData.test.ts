import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createLoveUpAdditionalBuffEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/loveUpAdditionalBuff';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType30はlong詳細値・Mood補正・対象・期限を正確に変換する', () => {
  const effect = createLoveUpAdditionalBuffEffect({
    skillEffectId: 30n,
    details: [
      { id: 1n, detailType: 'LOVE_UP_ADDITIONAL_BUFF_CALC_TYPE', targetMood: 0, value: 1n },
      {
        id: 2n,
        detailType: 'LOVE_UP_ADDITIONAL_BUFF_NUM',
        targetMood: 0,
        value: (1n << 53n) + 500_000n,
      },
      {
        id: 3n,
        detailType: 'LOVE_UP_ADDITIONAL_BUFF_BONUS_MOOD',
        targetMood: 2,
        value: (1n << 53n) + 10_000n,
      },
      { id: 4n, detailType: 'LOVE_UP_ADDITIONAL_BUFF_DISPLAY_TIME_TYPE', targetMood: 0, value: 2n },
      {
        id: 5n,
        detailType: 'LOVE_UP_ADDITIONAL_BUFF_DISPLAY_TIME',
        targetMood: 0,
        value: (1n << 53n) + 1n,
      },
      { id: 6n, detailType: 'LOVE_UP_ADDITIONAL_BUFF_DISABLED_TYPE', targetMood: 0, value: 1n },
      {
        id: 7n,
        detailType: 'LOVE_UP_ADDITIONAL_BUFF_DISABLED',
        targetMood: 0,
        value: (1n << 53n) + 2n,
      },
      { id: 8n, detailType: 'LOVE_UP_ADDITIONAL_BUFF_TARGET_TYPE', targetMood: 0, value: 3n },
      {
        id: 9n,
        detailType: 'LOVE_UP_ADDITIONAL_BUFF_TARGET_ID',
        targetMood: 0,
        value: (1n << 32n) + 1053n,
      },
    ],
  });

  expect(effect).toMatchObject({
    kind: 'love-up-additional-buff',
    calculation: 1n,
    num: (1n << 53n) + 500_000n,
    target: { kind: 'token-series', seriesId: 1053 },
    moodBonus: { target: 2, perPoint: expect.any(Number) },
    duration: { kind: 'sections', value: (1n << 53n) + 1n },
    disabledType: 1,
    disabledCount: (1n << 53n) + 2n,
  });
  if (effect.moodBonus?.target !== 2) throw new Error('Mood補正対象がありません。');
  expect(effect.moodBonus.perPoint).toBe(900_719_902_720);
});

it('ActionType30の詳細レコードをcreateGameでSTAR追加バフへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    {
      id: 30_001_1n,
      detailType: 'LOVE_UP_ADDITIONAL_BUFF_CALC_TYPE',
      targetMood: 0,
      value: 1n,
    },
    { id: 30_001_2n, detailType: 'LOVE_UP_ADDITIONAL_BUFF_NUM', targetMood: 0, value: 500_000n },
    {
      id: 30_001_3n,
      detailType: 'LOVE_UP_ADDITIONAL_BUFF_DISPLAY_TIME_TYPE',
      targetMood: 0,
      value: 3n,
    },
  ] as const;
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 30 as const,
              skillEffectId: 30_001n,
              destination: 'effects' as const,
              details,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  const effect = compiled?.effects.find((item) => item.kind === 'love-up-additional-buff');
  expect(effect).toEqual(createLoveUpAdditionalBuffEffect({ skillEffectId: 30_001n, details }));
});
