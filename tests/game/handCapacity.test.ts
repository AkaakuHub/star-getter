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
import { advanceHandLimitEffects } from '@akaakuhub/suku-sute-core/game/effects/handLimit';
import { advanceAction52SkillBoosts } from '@akaakuhub/suku-sute-core/game/effects/action52SkillBoost';
import {
  advanceHandMaxCardEffects,
  expireHandMaxCardSections,
} from '@akaakuhub/suku-sute-core/game/effects/handMaxCard';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.genesis.deck, 7, 100, routes.genesis.tokens), {
    type: 'start',
  });
}

it('手札目標数の期限後に上限を戻しても保持中の手札は減らさない', () => {
  const expanded = fillHand(applyEffect(game(), handCardCountEffect(3, 2, 1n)));
  expect(handCapacity(expanded)).toBe(8);
  expect(expanded.hand).toHaveLength(8);
  const nextSection = expanded.track.sections[1];
  if (!nextSection) throw new Error('次のパートがありません。');
  const nextPart = advanceTo(expanded, (nextSection.startBeat * 60) / expanded.track.bpm);
  expect(handCapacity(nextPart)).toBe(5);
  expect(nextPart.hand).toHaveLength(8);
});

it('ミリ秒期限の手札数変更を期限後に解除する', () => {
  const state = applyEffect(game(), handCardCountEffect(1, 1, 100n));
  expect(state.handLimit).toBe(6);
  expect(advanceTo(state, 0.2).handLimit).toBe(5);
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
    const afterTimer = advanceHandLimitEffects(state, 1).state;
    expect(afterTimer.handLimit).toBe(6);
    expect(afterTimer.handLimitEffects).toHaveLength(1);
    const deactivated = act(afterTimer, {
      type: 'deactivate-hand-limit',
      deactivationKey: `ability-${invocationType}`,
    });
    expect(deactivated.handLimit).toBe(5);
    expect(deactivated.handLimitEffects).toHaveLength(0);
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
  const active = activateHandPermanentEffects(state, card);
  expect(active.handLimit).toBe(4);
  expect(advanceHandLimitEffects(active, 100).state.handLimit).toBe(4);
  const disposed = disposeHandEffects(active, [card.cardInstanceId]);
  expect(disposed.handLimit).toBe(5);
  expect(disposed.handLimitEffects).toHaveLength(0);
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
      drawContext: 'skill' as const,
    },
    { hand: [], deck: [card.cardInstanceId], graveyard: [] },
  );

  const drawn = fillHandToCount(state, 1);

  expect(drawn.hand).toEqual([card.cardInstanceId]);
  expect(drawn.handLimit).toBe(initial.handLimit - 1);
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

it('手札枚数変更にスキル増幅を適用して整数化する', () => {
  const state = { ...game(), amplification: 150 };
  const next = applyEffect(state, handCardCountEffect(3, 3, 0n));
  expect(next.handLimit).toBe(9);
});

it('ActionType20へ発動元対象のActionType52補正を適用して整数化する', () => {
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
  const changed = applyEffect(boosted, handCardCountEffect(3, 3, 0n), source);
  expect(changed.handLimit).toBe(9);
});

it('手札枚数を減らす効果はランダム除外後に発動元を補充しない', () => {
  const state = fillHand(game());
  const source = state.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const activated = withBoardState(
    {
      ...state,
      activation: {
        sourceId: source.cardInstanceId,
        usedCards: [source.cardInstanceId],
        allHand: false,
        recoverDiscard: false,
        handCountChanges: {},
      },
    },
    { hand: state.hand.filter((id) => id !== source.cardInstanceId) },
  );
  const changed = applyEffect(activated, handCardCountEffect(-1, 3, 0n), source);
  const finished = finishCardActivation(changed);
  expect(finished.hand).toHaveLength(3);
  expect(boardCardIds(finished, liveBoardState.graveyard)).toHaveLength(2);
  expect(boardCardIds(finished, liveBoardState.graveyard)).toContain(source.cardInstanceId);
});

it('手札目標数より多い状態では使用元カードを補充しない', () => {
  const state = fillHand({ ...game(), handLimit: 7 });
  const source = state.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const activated = withBoardState(
    {
      ...state,
      handLimit: 5,
      activation: {
        sourceId: source.cardInstanceId,
        usedCards: [source.cardInstanceId],
        allHand: false,
        recoverDiscard: false,
        handCountChanges: {},
      },
    },
    { hand: state.hand.filter((id) => id !== source.cardInstanceId) },
  );
  const finished = finishCardActivation(activated);
  expect(finished.hand).toHaveLength(6);
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
  expect(fillHand(compressed).hand).toHaveLength(3);
  expect(handCapacity({ ...compressed, handLimit: 11 })).toBe(8);
});

it('手札最大化は手札を8枚まで補充し、期限後も保持した手札を減らさない', () => {
  const initial = game();
  const shortHand = withBoardState(
    { ...initial, handLimit: 4 },
    {
      hand: initial.hand.slice(0, 3),
      deck: initial.deck
        .map((card) => card.cardInstanceId)
        .filter((id) => !initial.hand.slice(0, 3).includes(id)),
    },
  );
  const expanded = applyEffect(shortHand, {
    kind: 'hand-max-card',
    duration: { kind: 'sections', value: 1n },
  });
  expect(expanded.hand).toHaveLength(8);
  expect(handCapacity(expanded)).toBe(8);
  const expired = expireHandMaxCardSections(expanded);
  expect(expired.handMaxCardEffects).toHaveLength(0);
  expect(expired.hand).toHaveLength(8);
  expect(handCapacity(expired)).toBe(4);
});

it('重複した手札最大化は他の期限が残る間だけ継続する', () => {
  const first = applyEffect(game(), {
    kind: 'hand-max-card',
    duration: { kind: 'milliseconds', value: 100n },
  });
  const second = applyEffect(first, {
    kind: 'hand-max-card',
    duration: { kind: 'stage' },
  });
  const afterTimer = advanceHandMaxCardEffects(second, 0.2);
  expect(afterTimer.handMaxCardEffects).toHaveLength(1);
  expect(handCapacity(afterTimer)).toBe(8);
});

it('InvocationType 0x388と0x38bは手動解除まで手札最大化を保つ', () => {
  for (const invocationType of [0x388, 0x38b] as const) {
    const deactivationKey = `hand-max-${invocationType}`;
    const activated = applyEffect(game(), {
      kind: 'hand-max-card',
      duration: { kind: 'milliseconds', value: 100n },
      invocationType,
      deactivationKey,
    });
    const timed = advanceHandMaxCardEffects(activated, 1);
    expect(timed.handMaxCardEffects).toHaveLength(1);
    const ended = act(timed, {
      type: 'deactivate-hand-max-card',
      deactivationKey,
    });
    expect(ended.handMaxCardEffects).toHaveLength(0);
    expect(ended.hand).toEqual(timed.hand);
  }
});
