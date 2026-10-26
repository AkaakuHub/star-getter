import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType36のModeIdと詳細構成をカードへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 36 as const,
              modeIds: [100],
              modeParameterChanges: { modeId: 100, off: [], on: [] },
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7);
  const compiled = state.deck.find((card) => card.id === source.id);
  expect(compiled?.modeIds).toContain(100);
  expect(compiled?.modeParameterChanges?.modeId).toBe(100);
  expect(state.modes.entries.some((mode) => mode.id === 100)).toBe(true);
});
