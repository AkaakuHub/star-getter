import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType34/35/37/38/39の詳細レコードを各Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 34 as const,
              skillEffectId: 34_001n,
              destination: 'effects' as const,
              details: [],
            },
            {
              actionType: 35 as const,
              skillEffectId: 35_001n,
              destination: 'effects' as const,
              details: [],
            },
            {
              actionType: 37 as const,
              skillEffectId: 37_001n,
              destination: 'effects' as const,
              details: [],
            },
            {
              actionType: 38 as const,
              skillEffectId: 38_001n,
              destination: 'effects' as const,
              details: [],
            },
            {
              actionType: 39 as const,
              skillEffectId: 39_001n,
              destination: 'effects' as const,
              details: [],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.some((item) => item.kind === 'disable-mental-down')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'mode')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'voltage-set')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'token-boost')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'infinity-gauge')).toBe(true);
});
