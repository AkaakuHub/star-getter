import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { expect, it } from 'vite-plus/test';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { handCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import { advanceHandCardCountEffects } from '@akaakuhub/suku-sute-core/game/effects/handCardCount';
import { flushHandCardCountActions } from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { game } from './support/game';
import { withBoardState } from './support/board';

it('期限終了は解除通知を待機させ、処理時に実手札から補充量を計算する', () => {
  const base = game();
  const source = base.deck[0];
  if (!source) throw new Error('カードがありません。');
  const initial = withBoardState(
    {
      ...base,
      deckDrawContext: {
        currentDrawType: 1 as const,
        usedCard: source,
        usedSkill: { skillType: 2 as const, skillMainEffect: 1 },
      },
    },
    {
      hand: base.deck.slice(0, 3).map((card) => card.cardInstanceId),
      deck: base.deck.slice(3).map((card) => card.cardInstanceId),
    },
  );
  const active = flushHandCardCountActions(applyEffect(initial, handCardCountEffect(-3, 1, 100n)));
  const pending = advanceHandCardCountEffects(active, 0.2);
  expect(pending.tokenCardDeck.handTargetCounts.current).toBe(2);
  expect(pending.deckActions.queue).toEqual([{ type: 1, param1: 3 }]);
  const result = flushHandCardCountActions(pending);
  expect(result.tokenCardDeck.handTargetCounts.current).toBe(5);
  expect(liveCurrentHandCardInstanceIds(result)).toHaveLength(5);
  expect(result.deckDrawContext.usedCard).toBeNull();
  expect(result.deckDrawContext.usedSkill).toBeNull();
});
