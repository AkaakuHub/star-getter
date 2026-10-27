import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { int64ToFloat32 } from '@akaakuhub/suku-sute-core/game/numeric';

it('ActionType2の詳細値をSTAR上昇Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 2 as const,
              skillEffectId: 2_001n,
              destination: 'effects' as const,
              details: [
                { id: 2_001_1n, detailType: 'LOVE_UP_CALC_TYPE', value: 1n },
                { id: 2_001_2n, detailType: 'LOVE_UP_NUM_BASE', value: 12_500n },
                { id: 2_001_3n, detailType: 'LOVE_DISPLAY_TIME_TYPE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'skill-score-up')).toMatchObject({
    kind: 'skill-score-up',
    calculation: 1,
    amount: 12_500,
    duration: { kind: 'full-end' },
  });
});

it('ActionType2のlong値をC#と同じfloat32に変換する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const base = (1n << 53n) + 1n;
  const mood = (1n << 54n) + (1n << 30n) + 1n;
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 2 as const,
              skillEffectId: 2_001n,
              destination: 'effects' as const,
              details: [
                { id: 2_001_1n, detailType: 'LOVE_UP_NUM_BASE', value: base },
                {
                  id: 2_001_2n,
                  detailType: 'LOVE_UP_NUM_BONUS_MOOD',
                  targetMood: 2,
                  value: mood,
                },
                { id: 2_001_3n, detailType: 'LOVE_DISPLAY_TIME_TYPE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const effect = createGame(track, deck, 7)
    .deck.find((card) => card.id === source.id)
    ?.effects.find((item) => item.kind === 'skill-score-up');
  expect(effect).toMatchObject({
    amount: int64ToFloat32(base),
    moodBonus: { target: 2, perPoint: Math.fround(int64ToFloat32(mood) / 10_000) },
  });
});
