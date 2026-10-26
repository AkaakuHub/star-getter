import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType28は指定されたTokenCardテンプレートからEffectを生成する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 28 as const,
              skillEffectId: 28_001n,
              destination: 'effects' as const,
              details: [{ id: 28_001_1n, detailType: 'TOKEN_CARD_CARD_COUNT', value: 2n }],
              templateId: source.id,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  expect(compiled?.effects.find((item) => item.kind === 'token-card')).toMatchObject({
    kind: 'token-card',
    templateId: source.id,
    count: 2n,
  });
});
