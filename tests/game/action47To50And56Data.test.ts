import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType47〜52/54/56〜58の詳細レコードを各Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: ([47, 48, 49, 50, 51, 52, 54, 56, 57, 58] as const).map((actionType) => ({
            actionType,
            skillEffectId: BigInt(actionType) * 1000n + 1n,
            destination: 'effects' as const,
            details: [],
          })),
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.some((item) => item.kind === 'beat-heart-value-buff')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'mood-change-skill')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'heart-limit-boost')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'mood-value-boost')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'mental-shield')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'genesis-skill')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'skill-boost')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'hand-max-card')).toBe(true);
  expect(compiled?.effects.some((item) => item.kind === 'proxy-skill-forced-activation')).toBe(
    true,
  );
  expect(compiled?.effects.some((item) => item.kind === 'fixed-parameter-extend')).toBe(true);
});
