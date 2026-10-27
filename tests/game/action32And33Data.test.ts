import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType32/33の詳細レコードを各追加バフへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 32 as const,
              skillEffectId: 32_001n,
              destination: 'effects' as const,
              details: [],
            },
            {
              actionType: 33 as const,
              skillEffectId: 33_001n,
              destination: 'effects' as const,
              details: [],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.some((item) => item.kind === 'recover-mental-additional-buff')).toBe(
    true,
  );
  expect(compiled?.effects.some((item) => item.kind === 'mental-barrier-additional-buff')).toBe(
    true,
  );
});
