import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { createHeartUpEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/heartUp';

it('ActionType16の対象・回数・期限詳細をきらめき増幅Effectへ接続する', () => {
  const track = tracks[0];
  const source = routes.genesis.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.genesis.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 16 as const,
              skillEffectId: 16_001n,
              destination: 'effects' as const,
              details: [
                { id: 16_001_1n, detailType: 'HEART_UP_NUM_BASE', value: 25_000n },
                { id: 16_001_2n, detailType: 'HEART_UP_DISPLAY_TIME_TYPE', value: 3n },
                { id: 16_001_3n, detailType: 'HEART_UP_TARGET_TYPE', value: 1n },
                { id: 16_001_4n, detailType: 'HEART_UP_TARGET_ID', value: 1031n },
                { id: 16_001_5n, detailType: 'HEART_UP_DISABLED_TYPE', value: 1n },
                { id: 16_001_6n, detailType: 'HEART_UP_DISABLED', value: 2n },
              ],
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'heart-boost')).toMatchObject({
    kind: 'heart-boost',
    percent: 2.5,
    uses: 2n,
    target: { kind: 'member', member: 1031 },
    duration: { kind: 'stage' },
  });
});

it('ActionType16の使用回数longをbigintのまま保持する', () => {
  const uses = (1n << 53n) + 1n;
  const effect = createHeartUpEffect({
    skillEffectId: 16n,
    details: [
      { id: 1n, detailType: 'HEART_UP_DISABLED_TYPE', value: 1n },
      { id: 2n, detailType: 'HEART_UP_DISABLED', value: uses },
    ],
  });
  expect(effect).toMatchObject({ uses });
});
