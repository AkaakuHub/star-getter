import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { int64ToFloat32 } from '@akaakuhub/suku-sute-core/runtime/numeric';

it('ActionType14のAP回復詳細値と空模様補正をAP効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 14 as const,
              details: [
                { id: 1n, detailType: 'RECOVER_AP_NUM_BASE', value: 25000n },
                {
                  id: 2n,
                  detailType: 'RECOVER_AP_NUM_BONUS_MOOD',
                  targetMood: 1,
                  value: 5000n,
                },
              ],
              destination: 'effects' as const,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'ap')).toEqual({
    kind: 'ap',
    amount: 2.5,
    moodBonus: { target: 1, perPoint: 0.5 },
  });
});

it('ActionType14のlong値を参照実装と同じfloat32に変換する', () => {
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
              actionType: 14 as const,
              details: [
                { id: 1n, detailType: 'RECOVER_AP_NUM_BASE', value: base },
                {
                  id: 2n,
                  detailType: 'RECOVER_AP_NUM_BONUS_MOOD',
                  targetMood: 1,
                  value: mood,
                },
              ],
              destination: 'effects' as const,
            },
          ],
        }
      : card,
  );
  const effect = createGame(track, deck, 7)
    .deck.find((card) => card.id === source.id)
    ?.effects.find((item) => item.kind === 'ap');
  expect(effect).toMatchObject({
    amount: Math.fround(int64ToFloat32(base) / 10_000),
    moodBonus: { target: 1, perPoint: Math.fround(int64ToFloat32(mood) / 10_000) },
  });
});
