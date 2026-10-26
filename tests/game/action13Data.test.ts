import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType13の詳細値を引き直しEffectへ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 13 as const,
              skillEffectId: 13_001n,
              destination: 'effects' as const,
              details: [
                { id: 13_001_1n, detailType: 'RESHUFFLE_RECOVERY_TYPE', value: 1n },
                { id: 13_001_2n, detailType: 'RESHUFFLE_STASH_TYPE', value: 1n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'reshuffle-skill')).toMatchObject({
    kind: 'reshuffle-skill',
    recoveryType: 1,
    stashType: 1,
  });
});
