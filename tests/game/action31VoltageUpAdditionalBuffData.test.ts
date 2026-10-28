import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createVoltageUpAdditionalBuffEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/voltageUpAdditionalBuff';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType31はlong詳細値から熱気追加バフを生成する', () => {
  const effect = createVoltageUpAdditionalBuffEffect({
    skillEffectId: 31n,
    details: [
      { id: 1n, detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_CALC_TYPE', targetMood: 0, value: 1n },
      {
        id: 2n,
        detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_NUM',
        targetMood: 0,
        value: (1n << 53n) + 250_000n,
      },
      {
        id: 3n,
        detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_BONUS_MOOD',
        targetMood: 1,
        value: (1n << 53n) + 10_000n,
      },
      {
        id: 4n,
        detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_DISPLAY_TIME_TYPE',
        targetMood: 0,
        value: 2n,
      },
      {
        id: 5n,
        detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_DISPLAY_TIME',
        targetMood: 0,
        value: (1n << 53n) + 1n,
      },
      {
        id: 6n,
        detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_DISABLED_TYPE',
        targetMood: 0,
        value: 1n,
      },
      {
        id: 7n,
        detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_DISABLED',
        targetMood: 0,
        value: (1n << 53n) + 2n,
      },
      {
        id: 8n,
        detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_TARGET_TYPE',
        targetMood: 0,
        value: 2n,
      },
      {
        id: 9n,
        detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_TARGET_ID',
        targetMood: 0,
        value: 3n,
      },
    ],
  });

  expect(effect).toMatchObject({
    kind: 'voltage-up-additional-buff',
    calculation: 1n,
    num: (1n << 53n) + 250_000n,
    target: { kind: 'unit', unit: 3 },
    moodBonus: { target: 1, perPoint: 900_719_902_720 },
    duration: { kind: 'sections', value: (1n << 53n) + 1n },
    disabledType: 1,
    disabledCount: (1n << 53n) + 2n,
  });
});

it('ActionType31の詳細レコードをcreateGameで熱気追加バフへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    {
      id: 31_001_1n,
      detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_CALC_TYPE',
      targetMood: 0,
      value: 1n,
    },
    {
      id: 31_001_2n,
      detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_NUM',
      targetMood: 0,
      value: 250_000n,
    },
    {
      id: 31_001_3n,
      detailType: 'ADD_VOLTAGE_ADDITIONAL_BUFF_DISPLAY_TIME_TYPE',
      targetMood: 0,
      value: 3n,
    },
  ] as const;
  const deck = routes.genesis.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 31 as const,
              skillEffectId: 31_001n,
              destination: 'effects' as const,
              details,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  const effect = compiled?.effects.find((item) => item.kind === 'voltage-up-additional-buff');
  expect(effect).toEqual(createVoltageUpAdditionalBuffEffect({ skillEffectId: 31_001n, details }));
});
