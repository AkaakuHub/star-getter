import { liveHandCardButtonId } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { withHandTarget } from './support/game';
import { boardCardIds } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import { liveBoardState } from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import { withBoardState } from './support/board';
import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import {
  fillHand,
  fillHandToCount,
  flushHandCardCountActions,
  handCapacity,
} from '@akaakuhub/suku-sute-core/game/cards/drawing';
import {
  activateHandPermanentEffects,
  disposeHandEffects,
} from '@akaakuhub/suku-sute-core/game/cards/handEffects';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { handCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import { finishCardActivation } from '@akaakuhub/suku-sute-core/game/cards/cardZones';
import { advanceTo, createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import { advanceHandCardCountEffects } from '@akaakuhub/suku-sute-core/game/effects/handCardCount';
import { advanceAction52SkillBoosts } from '@akaakuhub/suku-sute-core/game/effects/action52SkillBoost';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.genesis.deck, 7, 100, routes.genesis.tokens), {
    type: 'start',
  });
}

it('手札目標数の期限後に上限を戻しても保持中の手札は減らさない', () => {
  const expanded = flushHandCardCountActions(applyEffect(game(), handCardCountEffect(3, 2, 1n)));
  expect(handCapacity(expanded)).toBe(8);
  expect(liveCurrentHandCardInstanceIds(expanded)).toHaveLength(8);
  const nextSection = expanded.track.sections[1];
  if (!nextSection) throw new Error('次のパートがありません。');
  const nextPart = advanceTo(expanded, (nextSection.startBeat * 60) / expanded.track.bpm);
  expect(handCapacity(nextPart)).toBe(5);
  expect(liveCurrentHandCardInstanceIds(nextPart)).toHaveLength(8);
});

it('ミリ秒期限の手札数変更を期限後に解除する', () => {
  const state = flushHandCardCountActions(applyEffect(game(), handCardCountEffect(1, 1, 100n)));
  expect(state.tokenCardDeck.handTargetCounts.current).toBe(6);
  expect(advanceTo(state, 0.2).tokenCardDeck.handTargetCounts.current).toBe(5);
});

it('InvocationType 0x388と0x38bは自動期限を止め、Deactivator解除で元へ戻す', () => {
  for (const invocationType of [0x388, 0x38b] as const) {
    const state = applyEffect(
      game(),
      handCardCountEffect(1, 1, 100n, {
        invocationType,
        deactivationKey: `ability-${invocationType}`,
      }),
    );
    const afterTimer = flushHandCardCountActions(advanceHandCardCountEffects(state, 1));
    expect(afterTimer.tokenCardDeck.handTargetCounts.current).toBe(6);
    expect(afterTimer.handCardCountEffects.effects).toHaveLength(1);
    const deactivated = act(afterTimer, {
      type: 'deactivate-hand-limit',
      deactivationKey: `ability-${invocationType}`,
    });
    expect(deactivated.tokenCardDeck.handTargetCounts.current).toBe(5);
    expect(deactivated.handCardCountEffects.effects).toHaveLength(0);
  }
});

it('Action904の子Action20は手札中だけ有効で、離脱時に解除する', () => {
  const initial = game();
  const original = initial.deck[0];
  if (!original) throw new Error('対象カードがありません。');
  const card = {
    ...original,
    handPermanentEffects: [handCardCountEffect(-1, 2, 1n)],
  };
  const state = withBoardState(
    { ...initial, deck: [card], cardPool: [card], handEffectCardIds: [card.cardInstanceId] },
    { hand: [card.cardInstanceId], deck: [], graveyard: [] },
  );
  const active = flushHandCardCountActions(activateHandPermanentEffects(state, card));
  expect(active.tokenCardDeck.handTargetCounts.current).toBe(4);
  expect(advanceHandCardCountEffects(active, 100).tokenCardDeck.handTargetCounts.current).toBe(4);
  const disposed = flushHandCardCountActions(disposeHandEffects(active, [card.cardInstanceId]));
  expect(disposed.tokenCardDeck.handTargetCounts.current).toBe(5);
  expect(disposed.handCardCountEffects.effects).toHaveLength(0);
});

it('Action904は通常ドローで手札へ入った時点で子効果を発動する', () => {
  const initial = game();
  const original = initial.deck[0];
  if (!original) throw new Error('対象カードがありません。');
  const card = {
    ...original,
    handPermanentEffects: [handCardCountEffect(-1, 3, 0n)],
  };
  const state = withBoardState(
    {
      ...initial,
      deck: [card],
      cardPool: [card],
      handCardStats: {},
      handEffectCardIds: [],
      deckDrawContext: { currentDrawType: 3 as const, usedCard: null, usedSkill: null },
    },
    { hand: [], deck: [card.cardInstanceId], graveyard: [] },
  );

  const drawn = flushHandCardCountActions(fillHandToCount(state, 1));

  expect(liveCurrentHandCardInstanceIds(drawn)).toEqual([card.cardInstanceId]);
  expect(drawn.tokenCardDeck.handTargetCounts.current).toBe(
    initial.tokenCardDeck.handTargetCounts.current - 1,
  );
  expect(drawn.activeHandPermanentCardIds).toContain(card.cardInstanceId);
});

it('Action904のAction2子効果は手札離脱時に解除する', () => {
  const initial = game();
  const original = initial.deck[0];
  if (!original) throw new Error('対象カードがありません。');
  const card = {
    ...original,
    handPermanentEffects: [
      {
        kind: 'skill-score-up' as const,
        calculation: 1,
        amount: 200_000,
        duration: { kind: 'full-end' as const, value: 0 },
        disabledType: 0,
      },
    ],
  };
  const state = withBoardState(
    { ...initial, deck: [card], cardPool: [card], handEffectCardIds: [card.cardInstanceId] },
    { hand: [card.cardInstanceId], deck: [], graveyard: [] },
  );
  const active = activateHandPermanentEffects(state, card);
  expect(active.skillScoreUps).toHaveLength(1);
  expect(disposeHandEffects(active, [card.cardInstanceId]).skillScoreUps).toHaveLength(0);
});

it('Action904のAction52子効果は自動期限を止め、手札離脱時に解除する', () => {
  const initial = game();
  const original = initial.deck[0];
  if (!original) throw new Error('対象カードがありません。');
  const card = {
    ...original,
    handPermanentEffects: [
      {
        kind: 'skill-boost' as const,
        num: 200_000,
        target: { kind: 'all' as const },
        duration: { kind: 'milliseconds' as const, value: 100n },
        uses: null,
      },
    ],
  };
  const state = withBoardState(
    { ...initial, deck: [card], cardPool: [card], handEffectCardIds: [card.cardInstanceId] },
    { hand: [card.cardInstanceId], deck: [], graveyard: [] },
  );

  const active = activateHandPermanentEffects(state, card);

  expect(active.action52Buffs).toHaveLength(1);
  const afterTime = advanceAction52SkillBoosts(active, 1);
  expect(afterTime.action52Buffs).toHaveLength(1);
  expect(disposeHandEffects(afterTime, [card.cardInstanceId]).action52Buffs).toHaveLength(0);
});

it('手札枚数変更にスキル増幅を適用して切り上げる', () => {
  const state = { ...game(), amplification: 150 };
  const next = flushHandCardCountActions(applyEffect(state, handCardCountEffect(3, 3, 0n)));
  expect(next.tokenCardDeck.handTargetCounts.current).toBe(10);
});

it('ActionType20へ発動元対象のActionType52補正を適用して切り上げる', () => {
  const base = game();
  const source = base.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const initial = {
    ...base,
    amplification: 100,
    storyAmplification: 0,
    handEffectCardIds: [],
    targetBoosts: [],
  };
  const boosted = applyEffect(
    initial,
    {
      kind: 'skill-boost',
      num: 500_000,
      target: { kind: 'member', member: source.charactersId },
      duration: { kind: 'stage', value: 0n },
      uses: null,
    },
    source,
  );
  const changed = flushHandCardCountActions(
    applyEffect(boosted, handCardCountEffect(3, 3, 0n), source),
  );
  expect(changed.tokenCardDeck.handTargetCounts.current).toBe(10);
});

it('手札枚数を1枚減らす効果は使用元だけを抜き、ほかのカードを減らさない', () => {
  const state = fillHand(game());
  const source = state.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const activated = withBoardState(
    {
      ...state,
      activation: {
        sourceId: source.cardInstanceId,
        handCardButtonId: liveHandCardButtonId(state, source.cardInstanceId),
        usedCards: [source.cardInstanceId],
        hasUseAllHandSkill: false,
      },
    },
    { hand: liveCurrentHandCardInstanceIds(state) },
  );
  const changed = applyEffect(activated, handCardCountEffect(-1, 3, 0n), source);
  const finished = finishCardActivation(changed);
  expect(liveCurrentHandCardInstanceIds(finished)).toEqual(
    liveCurrentHandCardInstanceIds(state).filter((id) => id !== source.cardInstanceId),
  );
  expect(boardCardIds(finished, liveBoardState.graveyard)).toHaveLength(1);
  expect(boardCardIds(finished, liveBoardState.graveyard)).toContain(source.cardInstanceId);
});

it('手札目標数より多い状態では使用元カードを補充しない', () => {
  const state = fillHand(withHandTarget(game(), 7));
  const source = state.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const activated = withBoardState(
    {
      ...withHandTarget(state, 5),
      activation: {
        sourceId: source.cardInstanceId,
        handCardButtonId: liveHandCardButtonId(withHandTarget(state, 5), source.cardInstanceId),
        usedCards: [source.cardInstanceId],
        hasUseAllHandSkill: false,
      },
    },
    { hand: liveCurrentHandCardInstanceIds(state) },
  );
  const finished = finishCardActivation(activated);
  expect(liveCurrentHandCardInstanceIds(finished)).toHaveLength(6);
  expect(boardCardIds(finished, liveBoardState.graveyard)).toContain(source.cardInstanceId);
});

it('手札内の減少効果を合算してから、上限を3〜8枚に制限する', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('カードがありません。');
  const compressed = withBoardState(
    {
      ...state,
      deck: state.deck.map((item) =>
        item.cardInstanceId === card.cardInstanceId
          ? { ...item, passive: { heartsPercent: 100, handLimitDelta: -3 } }
          : item,
      ),
    },
    {
      hand: [card.cardInstanceId],
      deck: state.deck
        .filter((item) => item.cardInstanceId !== card.cardInstanceId)
        .map((item) => item.cardInstanceId),
      graveyard: [],
    },
  );
  expect(handCapacity(compressed)).toBe(3);
  expect(liveCurrentHandCardInstanceIds(fillHand(compressed))).toHaveLength(3);
  expect(handCapacity(withHandTarget(compressed, 11))).toBe(8);
});
