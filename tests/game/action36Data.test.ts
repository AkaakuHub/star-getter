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
              details: [
                { id: 1n, detailType: 'MODE_SKILL_CHANGE_MODE_ID', value: 100n },
                {
                  id: 2n,
                  detailType: 'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_1',
                  value: 4_294_967_496n,
                },
                {
                  id: 3n,
                  detailType: 'MODE_SKILL_CHANGE_CARD_SKILL_SERIES_ID_2',
                  value: 4_294_967_497n,
                },
              ],
              modeParameterChanges: { modeId: 100, off: [], on: [] },
              modeSkillChanges: {
                offSeriesId: 200,
                onSeriesId: 201,
                off: { cost: 2, effects: [], skillIcon: 20, special: null },
                on: { cost: 3, effects: [], skillIcon: 21, special: null },
              },
            },
          ],
        }
      : card,
  );
  const state = createGame(track, deck, 7);
  const compiled = state.deck.find((card) => card.id === source.id);
  expect(compiled?.modeIds).toContain(100);
  expect(compiled?.modeParameterChanges?.modeId).toBe(100);
  expect(compiled?.modeSkillChanges).toMatchObject({
    modeId: 100,
    off: { cost: 2, skillIcon: 20 },
    on: { cost: 3, skillIcon: 21 },
  });
  expect(state.modes.entries.some((mode) => mode.id === 100)).toBe(true);
});
