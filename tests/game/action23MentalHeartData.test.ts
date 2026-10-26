import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createMentalHeartInduceEffect } from '../../src/domain/game/actionTypeEffects/mentalHeartInduce';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType23はlong詳細値のint32化とパート期限のlong保持を行う', () => {
  const effect = createMentalHeartInduceEffect({
    skillEffectId: 23n,
    details: [
      { id: 1n, detailType: 'MENTAL_HEART_INDUCE_NUM', value: (1n << 32n) + 10_000n },
      { id: 2n, detailType: 'MENTAL_HEART_INDUCE_HEART_DISPLAY_TIME_TYPE', value: 1n },
      { id: 3n, detailType: 'MENTAL_HEART_INDUCE_HEART_DISPLAY_TIME', value: (1n << 32n) + 250n },
      { id: 4n, detailType: 'MENTAL_HEART_INDUCE_DISPLAY_TIME_TYPE', value: 2n },
      {
        id: 5n,
        detailType: 'MENTAL_HEART_INDUCE_DISPLAY_TIME',
        value: (1n << 53n) + 1n,
      },
      { id: 6n, detailType: 'MENTAL_HEART_INDUCE_DISABLED_TYPE', value: 1n },
      { id: 7n, detailType: 'MENTAL_HEART_INDUCE_DISABLED', value: (1n << 53n) + 3n },
    ],
  });

  expect(effect).toMatchObject({
    kind: 'mental-heart-induce',
    num: (1n << 32n) + 10_000n,
    heartDuration: { kind: 'milliseconds', value: 250 },
    duration: { kind: 'sections', value: (1n << 53n) + 1n },
    disabledType: 1,
    disabledValue: (1n << 53n) + 3n,
  });
});

it('ActionType23の詳細レコードをcreateGameで精神力連動効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    { id: 23_001_1n, detailType: 'MENTAL_HEART_INDUCE_NUM', value: 10_000n },
    { id: 23_001_2n, detailType: 'MENTAL_HEART_INDUCE_DISPLAY_TIME_TYPE', value: 3n },
    { id: 23_001_3n, detailType: 'MENTAL_HEART_INDUCE_DISPLAY_TIME', value: 0n },
  ] as const;
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 23 as const,
              skillEffectId: 23_001n,
              destination: 'effects' as const,
              details,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  const effect = compiled?.effects.find((item) => item.kind === 'mental-heart-induce');
  expect(effect).toEqual(createMentalHeartInduceEffect({ skillEffectId: 23_001n, details }));
});
