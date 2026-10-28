import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType13の詳細値を引き直しEffectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
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
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((item) => item.kind === 'reshuffle-skill')).toMatchObject({
    kind: 'reshuffle-skill',
    recoveryType: 1n,
    stashType: 1n,
  });
});

it('ActionType13の回収・戻し先種別はlong比較し、int32へ折り返さない', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 13 as const,
              skillEffectId: 13_002n,
              destination: 'effects' as const,
              details: [
                { id: 13_002_1n, detailType: 'RESHUFFLE_RECOVERY_TYPE', value: (1n << 32n) + 1n },
                { id: 13_002_2n, detailType: 'RESHUFFLE_STASH_TYPE', value: (1n << 32n) + 1n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((item) => item.kind === 'reshuffle-skill')).toMatchObject({
    kind: 'reshuffle-skill',
    recoveryType: (1n << 32n) + 1n,
    stashType: (1n << 32n) + 1n,
  });
});
