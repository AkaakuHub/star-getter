import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { int64ToFloat32 } from '@akaakuhub/suku-sute-core/game/numeric';

it('ActionType3の詳細値をBeatPoint上昇Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 3 as const,
              skillEffectId: 3_001n,
              destination: 'effects' as const,
              details: [
                { id: 3_001_1n, detailType: 'BP_UP_NUM_BASE', value: 12_500n },
                { id: 3_001_2n, detailType: 'BP_UP_DISPLAY_TIME_TYPE', value: 2n },
                { id: 3_001_3n, detailType: 'BP_UP_DISPLAY_TIME', value: 2n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'beat-point-buff')).toMatchObject({
    kind: 'beat-point-buff',
    amount: 12_500,
    duration: { kind: 'sections', value: 2 },
  });
});

it('ActionType3のlong値を参照実装と同じfloat32に変換する', () => {
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
              actionType: 3 as const,
              skillEffectId: 3_001n,
              destination: 'effects' as const,
              details: [
                { id: 3_001_1n, detailType: 'BP_UP_NUM_BASE', value: base },
                {
                  id: 3_001_2n,
                  detailType: 'BP_UP_NUM_BONUS_MOOD',
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
    ?.effects.find((item) => item.kind === 'beat-point-buff');
  expect(effect).toMatchObject({
    amount: int64ToFloat32(base),
    moodBonus: { target: 2, perPoint: Math.fround(int64ToFloat32(mood) / 10_000) },
  });
});
