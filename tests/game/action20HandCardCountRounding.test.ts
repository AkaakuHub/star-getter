import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { createHandCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import { applyHandLimit } from '@akaakuhub/suku-sute-core/game/effects/handLimit';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.genesis.deck, 7), { type: 'start' });
}

it.each([
  { amount: 1, multiplier: 1.2, boost: 0, expected: 2 },
  { amount: -1, multiplier: 1.2, boost: 0, expected: -1 },
  { amount: 1, multiplier: 1.2, boost: 10, expected: 3 },
  { amount: 1, multiplier: 0.1, boost: 0, expected: 1 },
  { amount: 2_147_483_647, multiplier: 2, boost: 0, expected: 2_147_483_647 },
])(
  'ActionType20は追加バフの前後で切り上げる: $amount × $multiplier、$boost%',
  ({ amount, multiplier, boost, expected }) => {
    const initial = game();
    const card = initial.deck[0];
    if (!card) throw new Error('カードがありません。');
    const state = {
      ...initial,
      amplification: 100,
      handEffectCardIds: [],
      action52Buffs: [
        {
          id: 1,
          percent: boost,
          target: { kind: 'all' as const },
          remainingSeconds: null,
          remainingSections: null,
          remainingUses: 1n,
          skillTokenSeriesIds: null,
          deactivationKey: null,
        },
      ],
    };
    const effect = createHandCardCountEffect({
      skillEffectId: 20_003n,
      details: [
        { id: 20_003_1n, detailType: 'CHANGE_HAND_CARD_COUNT_CALC_TYPE', value: 1n },
        { id: 20_003_2n, detailType: 'CHANGE_HAND_CARD_COUNT_NUM', value: BigInt(amount) },
        { id: 20_003_3n, detailType: 'CHANGE_HAND_CARD_COUNT_DISPLAY_TIME_TYPE', value: 3n },
      ],
    });
    if (effect.kind !== 'hand-limit') throw new Error('手札枚数変更ではありません。');
    const result = applyHandLimit(state, effect, card, multiplier);
    expect(result.tokenCardDeck.handTargetCounts.current).toBe(
      state.tokenCardDeck.handTargetCounts.current,
    );
    expect(result.deckActions.queue.at(-1)).toEqual({ type: 0, param1: expected });
    expect(result.handLimitEffects.at(-1)).toMatchObject({
      amount: expected,
      expirationAmount: -expected | 0,
    });
    expect(result.action52Buffs).toHaveLength(amount > 0 ? 0 : 1);
  },
);
