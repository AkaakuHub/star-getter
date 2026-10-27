import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createHeartLimitChangeEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/heartLimitChange';
import { resolveEffectParameterDetails } from '@akaakuhub/suku-sute-core/game/parameters/parameterValueChange';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { game } from './support/game';

it('ActionType25はlongの詳細値・対象Mood・期限を保持して計算種別をint32化する', () => {
  const effect = createHeartLimitChangeEffect({
    skillEffectId: 25n,
    details: [
      {
        id: 1n,
        detailType: 'CHANGE_HEART_LIMIT_CALC_TYPE',
        targetMood: 0,
        value: (1n << 32n) + 2n,
      },
      { id: 2n, detailType: 'CHANGE_HEART_LIMIT_NUM', targetMood: 0, value: (1n << 53n) + 7n },
      {
        id: 3n,
        detailType: 'CHANGE_HEART_LIMIT_NUM_BONUS_MOOD',
        targetMood: 2,
        value: (1n << 53n) + 9n,
      },
      { id: 4n, detailType: 'CHANGE_HEART_LIMIT_DISPLAY_TIME_TYPE', targetMood: 0, value: 2n },
      {
        id: 5n,
        detailType: 'CHANGE_HEART_LIMIT_DISPLAY_TIME',
        targetMood: 0,
        value: (1n << 53n) + 1n,
      },
    ],
  });

  expect(effect).toMatchObject({
    kind: 'heart-limit-change',
    calculationType: 2,
    num: (1n << 53n) + 7n,
    bonusMoodTarget: 2,
    bonusMoodValue: (1n << 53n) + 9n,
    duration: { kind: 'sections', value: (1n << 53n) + 1n },
  });
});

it('ActionType25の詳細レコードをcreateGameでハート上限効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    { id: 25_001_1n, detailType: 'CHANGE_HEART_LIMIT_CALC_TYPE', targetMood: 0, value: 1n },
    { id: 25_001_2n, detailType: 'CHANGE_HEART_LIMIT_NUM', targetMood: 0, value: 15_000n },
    { id: 25_001_3n, detailType: 'CHANGE_HEART_LIMIT_DISPLAY_TIME_TYPE', targetMood: 0, value: 3n },
  ] as const;
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 25 as const,
              skillEffectId: 25_001n,
              destination: 'effects' as const,
              details,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  const effect = compiled?.effects.find((item) => item.kind === 'heart-limit-change');
  expect(effect).toEqual(createHeartLimitChangeEffect({ skillEffectId: 25_001n, details }));
});

it('ActionType25はActionType18による計算種別の詳細値補正を適用する', () => {
  const initial = game();
  const card = initial.deck[0];
  if (!card) throw new Error('検証用カードがありません。');
  const detailId = 25_002_1n;
  const effect = createHeartLimitChangeEffect({
    skillEffectId: 25_002n,
    details: [
      {
        id: detailId,
        detailType: 'CHANGE_HEART_LIMIT_CALC_TYPE',
        targetMood: 0,
        value: 1n,
      },
    ],
  });
  const state = {
    ...initial,
    parameterValueFactors: [
      { cardId: card.id, sourceEffectId: 'parameter-value', targetDetailId: detailId, factor: 2 },
    ],
  };

  expect(resolveEffectParameterDetails(state, card, effect)).toMatchObject({
    kind: 'heart-limit-change',
    calculationType: 2,
  });
});
