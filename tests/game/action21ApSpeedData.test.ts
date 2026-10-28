import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createApSpeedChangeEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/apSpeedChange';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import {
  activateHandPermanentEffects,
  disposeHandEffects,
} from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType21は種別をint32へ変換しnumと期限はsigned64のまま扱う', () => {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const state = act(createGame(track, routes.genesis.deck, 7), { type: 'start' });
  const displayTime = (1n << 53n) + 1n;
  const effect = createApSpeedChangeEffect({
    skillEffectId: 10213010015n,
    details: [
      {
        id: 102130100150n,
        detailType: 'CHANGE_AP_INCREASE_SPEED_CALC_TYPE',
        targetMood: 0,
        value: (1n << 32n) + 2n,
      },
      {
        id: 102130100151n,
        detailType: 'CHANGE_AP_INCREASE_SPEED_NUM',
        targetMood: 0,
        value: (1n << 32n) + 7000n,
      },
      {
        id: 102130100152n,
        detailType: 'CHANGE_AP_INCREASE_SPEED_NUM_BONUS_MOOD',
        targetMood: 0,
        value: 0n,
      },
      {
        id: 102130100153n,
        detailType: 'CHANGE_AP_INCREASE_SPEED_DISPLAY_TIME_TYPE',
        targetMood: 0,
        value: (1n << 32n) + 2n,
      },
      {
        id: 102130100154n,
        detailType: 'CHANGE_AP_INCREASE_SPEED_DISPLAY_TIME',
        targetMood: 0,
        value: displayTime,
      },
    ],
  });

  expect(effect).toMatchObject({
    kind: 'ap-speed-change',
    calculationType: 2,
    num: (1n << 32n) + 7000n,
    displayTimeType: (1n << 32n) + 2n,
    displayTime,
  });
  const applied = applyEffect(state, effect);
  expect(applied.apIncreaseSpeedEffects[0]?.calculation).toEqual({
    kind: 'multiply',
    factor: 429497.4375,
  });
  expect(applied.apIncreaseSpeedEffects[0]?.duration).toEqual({
    kind: 'sections',
    remainingChanges: displayTime,
  });
});

it('ActionType21の詳細レコードをcreateGameでAP時間効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    {
      id: 21_001_1n,
      detailType: 'CHANGE_AP_INCREASE_SPEED_CALC_TYPE',
      targetMood: 0,
      value: 2n,
    },
    {
      id: 21_001_2n,
      detailType: 'CHANGE_AP_INCREASE_SPEED_NUM',
      targetMood: 0,
      value: 7000n,
    },
    {
      id: 21_001_3n,
      detailType: 'CHANGE_AP_INCREASE_SPEED_DISPLAY_TIME_TYPE',
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
              actionType: 21 as const,
              skillEffectId: 21_001n,
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
  const effect = compiled?.effects.find((item) => item.kind === 'ap-speed-change');
  expect(effect).toEqual(createApSpeedChangeEffect({ skillEffectId: 21_001n, details }));
});

it('ActionType21のHandPermanent詳細レコードを起動し、手札離脱時に解除する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 21 as const,
              skillEffectId: 21_002n,
              destination: 'handPermanentEffects' as const,
              details: [
                {
                  id: 21_002_1n,
                  detailType: 'CHANGE_AP_INCREASE_SPEED_CALC_TYPE',
                  targetMood: 0,
                  value: 1n,
                },
                {
                  id: 21_002_2n,
                  detailType: 'CHANGE_AP_INCREASE_SPEED_NUM',
                  targetMood: 0,
                  value: 100n,
                },
                {
                  id: 21_002_3n,
                  detailType: 'CHANGE_AP_INCREASE_SPEED_DISPLAY_TIME_TYPE',
                  targetMood: 0,
                  value: 1n,
                },
                {
                  id: 21_002_4n,
                  detailType: 'CHANGE_AP_INCREASE_SPEED_DISPLAY_TIME',
                  targetMood: 0,
                  value: 100n,
                },
              ],
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7);
  const compiled = state.deck.find((card) => card.cardInstanceId === source.cardInstanceId);
  if (!compiled) throw new Error('ActionType21の発動元カードがありません。');
  const activated = activateHandPermanentEffects(state, compiled);
  expect(activated.apIncreaseSpeedEffects).toHaveLength(1);
  expect(activated.apIncreaseSpeedEffects[0]?.duration).toEqual({ kind: 'full-end' });
  const disposed = disposeHandEffects(activated, [compiled.cardInstanceId]);
  expect(disposed.apIncreaseSpeedEffects).toHaveLength(0);
});
