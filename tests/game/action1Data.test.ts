import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { int64ToFloat32 } from '@akaakuhub/suku-sute-core/runtime/numeric';

it('ActionType1の詳細値をSkillHeart Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 1 as const,
              skillEffectId: 1_001n,
              destination: 'effects' as const,
              details: [
                { id: 1_001_1n, detailType: 'HEART_CALC_TYPE', value: 2n },
                { id: 1_001_2n, detailType: 'HEART_NUM_BASE', value: 10_000n },
                { id: 1_001_3n, detailType: 'HEART_DISPLAY_TIME_TYPE', value: 3n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'skill-hearts')).toMatchObject({
    kind: 'skill-hearts',
    calculation: 'fixed',
    amount: 10_000,
    displayTime: { kind: 'full-end' },
  });
});

it('ActionType1のMood補正longを参照実装と同じfloat32に変換する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const mood = (1n << 54n) + (1n << 30n) + 1n;
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 1 as const,
              skillEffectId: 1_001n,
              destination: 'effects' as const,
              details: [
                { id: 1_001_1n, detailType: 'HEART_CALC_TYPE', value: 1n },
                {
                  id: 1_001_2n,
                  detailType: 'HEART_NUM_BONUS_MOOD',
                  targetMood: 2,
                  value: mood,
                },
              ],
            },
          ],
        }
      : card,
  );
  const effect = createGame(track, deck, 7)
    .deck.find((card) => card.id === source.id)
    ?.effects.find((item) => item.kind === 'skill-hearts');
  expect(effect).toMatchObject({
    moodBonus: { target: 2, perPoint: Math.fround(int64ToFloat32(mood) / 10_000) },
  });
});
