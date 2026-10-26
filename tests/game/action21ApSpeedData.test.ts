import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createApSpeedChangeEffect } from '../../src/domain/game/actionTypeEffects/apSpeedChange';
import { act } from '../../src/domain/game/actions';
import { applyEffect } from '../../src/domain/game/effects';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType21の詳細値をint32・longのC#変換順でAP時間効果へ接続する', () => {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const state = act(createGame(track, routes.bloom.deck, 7), { type: 'start' });
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
  expect(applied.apTimeEffects[0]?.value).toBeCloseTo(0.7, 5);
  expect(applied.apTimeEffects[0]?.remainingSections).toBe(displayTime);
});

it('ActionType21の詳細レコードをcreateGameでAP時間効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
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
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
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
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  const effect = compiled?.effects.find((item) => item.kind === 'ap-speed-change');
  expect(effect).toEqual(createApSpeedChangeEffect({ skillEffectId: 21_001n, details }));
});
