import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { createDeckSkillCostChangeEffect } from '../../src/domain/game/actionTypeEffects/deckSkillCostChange';
import { createGame } from '../../src/domain/game/simulation';

it('ActionType29はlong詳細値をint32化してデッキ対象条件を作る', () => {
  const effect = createDeckSkillCostChangeEffect({
    skillEffectId: 29n,
    details: [
      { id: 1n, detailType: 'CHANGE_DECK_AP_NUM', value: (1n << 32n) - 10n },
      { id: 2n, detailType: 'CHANGE_DECK_AP_TARGET_RANGE', value: 3n },
      { id: 3n, detailType: 'CHANGE_DECK_AP_TARGET_TYPE', value: 5n },
      { id: 4n, detailType: 'CHANGE_DECK_AP_TARGET_TYPE_ID', value: (1n << 32n) + 8123n },
    ],
  });

  expect(effect).toEqual({
    kind: 'deck-skill-cost-change',
    num: -10,
    targetRange: 3,
    target: 'token-series',
    targetId: 8123,
  });
});

it('ActionType29の詳細レコードをcreateGameでデッキコスト効果へ接続する', () => {
  const track = tracks[0];
  const source = routes.bloom.deck[0];
  if (!track || !source) throw new Error('ゲームデータがありません。');
  const details = [
    { id: 29_001_1n, detailType: 'CHANGE_DECK_AP_NUM', value: -10n },
    { id: 29_001_2n, detailType: 'CHANGE_DECK_AP_TARGET_RANGE', value: 3n },
    { id: 29_001_3n, detailType: 'CHANGE_DECK_AP_TARGET_TYPE', value: 5n },
    { id: 29_001_4n, detailType: 'CHANGE_DECK_AP_TARGET_TYPE_ID', value: 8123n },
  ] as const;
  const deck = routes.bloom.deck.map((card) =>
    card.id === source.id
      ? {
          ...card,
          actionEffects: [
            {
              actionType: 29 as const,
              skillEffectId: 29_001n,
              destination: 'effects' as const,
              details,
            },
          ],
        }
      : card,
  );
  const compiled = createGame(track, deck, 7).deck.find((card) => card.id === source.id);
  const effect = compiled?.effects.find((item) => item.kind === 'deck-skill-cost-change');
  expect(effect).toEqual(createDeckSkillCostChangeEffect({ skillEffectId: 29_001n, details }));
});
