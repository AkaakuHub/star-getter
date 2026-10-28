import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

it('ActionType907の対象・しきい値・子効果IDを効果誘発へ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const child = { kind: 'mood' as const, amount: 2, skillEffectId: 90711n };
  const deck = routes.genesis.deck.map((card) =>
    card.cardInstanceId === source.cardInstanceId
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 907 as const,
              skillEffectId: 90710n,
              details: [
                { id: 1n, detailType: 'EFFECT_INDUCE_TARGET_EFFECT', value: 1n },
                { id: 2n, detailType: 'EFFECT_INDUCE_THRESHOLD_TYPE', value: 1n },
                { id: 3n, detailType: 'EFFECT_INDUCE_THRESHOLD_NUM', value: 50000n },
                { id: 90711n, detailType: 'EFFECT_INDUCE_EFFECT_ID1', value: 0n },
              ],
              childEffects: [child],
              destination: 'effects' as const,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find(
    (card) => card.cardInstanceId === source.cardInstanceId,
  );
  expect(compiled?.effects.find((effect) => effect.kind === 'effect-induce')).toEqual({
    kind: 'effect-induce',
    sourceEffectId: '90710',
    target: 'mental-barrier',
    threshold: { kind: 'at-least', value: 50000n },
    effects: [child],
  });
});
