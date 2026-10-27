import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType12の条件と子Effectを分岐Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 12 as const,
              destination: 'effects' as const,
              condition: { kind: 'heat' as const, minimum: 50 },
              whenTrue: [{ kind: 'hearts' as const, amount: 100 }],
              whenFalse: [{ kind: 'stamina' as const, amount: 200 }],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'branch')).toMatchObject({
    kind: 'branch',
    condition: { kind: 'heat', minimum: 50 },
    whenTrue: [{ kind: 'hearts', amount: 100 }],
    whenFalse: [{ kind: 'stamina', amount: 200 }],
  });
});
