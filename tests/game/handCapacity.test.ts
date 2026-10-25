import { expect, it } from 'vite-plus/test';
import { routes } from '../../src/content/routes';
import { tracks } from '../../src/content/tracks';
import { act } from '../../src/domain/game/actions';
import { fillHand, handCapacity } from '../../src/domain/game/cards/drawing';
import {
  activateHandPermanentEffects,
  disposeHandEffects,
} from '../../src/domain/game/cards/handEffects';
import { applyEffect } from '../../src/domain/game/effects';
import { finishCardActivation } from '../../src/domain/game/cards/cardZones';
import { advanceTo, createGame } from '../../src/domain/game/simulation';
import { advanceHandLimitEffects } from '../../src/domain/game/effects/handLimit';
import {
  advanceHandMaxCardEffects,
  expireHandMaxCardSections,
} from '../../src/domain/game/effects/handMaxCard';

function game() {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return act(createGame(track, routes.bloom.deck, 7, 100, routes.bloom.tokens), {
    type: 'start',
  });
}

it('手札目標数の期限後に上限を戻しても保持中の手札は減らさない', () => {
  const expanded = fillHand(
    applyEffect(game(), {
      kind: 'hand-limit',
      amount: 3,
      duration: { kind: 'sections', value: 1 },
    }),
  );
  expect(handCapacity(expanded)).toBe(8);
  expect(expanded.hand).toHaveLength(8);
  const nextSection = expanded.track.sections[1];
  if (!nextSection) throw new Error('次のパートがありません。');
  const nextPart = advanceTo(expanded, (nextSection.startBeat * 60) / expanded.track.bpm);
  expect(handCapacity(nextPart)).toBe(5);
  expect(nextPart.hand).toHaveLength(8);
});

it('ミリ秒期限の手札数変更を期限後に解除する', () => {
  const state = applyEffect(game(), {
    kind: 'hand-limit',
    amount: 1,
    duration: { kind: 'milliseconds', value: 100 },
  });
  expect(state.handLimit).toBe(6);
  expect(advanceTo(state, 0.2).handLimit).toBe(5);
});

it('InvocationType 0x388と0x38bは自動期限を止め、Deactivator解除で元へ戻す', () => {
  for (const invocationType of [0x388, 0x38b] as const) {
    const state = applyEffect(game(), {
      kind: 'hand-limit',
      amount: 1,
      duration: { kind: 'milliseconds', value: 100 },
      invocationType,
      deactivationKey: `ability-${invocationType}`,
    });
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
    handPermanentEffects: [
      {
        kind: 'hand-limit' as const,
        amount: -1,
        duration: { kind: 'sections' as const, value: 1 },
      },
    ],
  };
  const state = {
    ...initial,
    deck: [card],
    cardPool: [card],
    hand: [card.id],
    handEffectCardIds: [card.id],
    drawPile: [],
    discard: [],
  };
  const active = activateHandPermanentEffects(state, card);
  expect(active.handLimit).toBe(4);
  expect(advanceHandLimitEffects(active, 100).state.handLimit).toBe(4);
  const disposed = disposeHandEffects(active, [card.id]);
  expect(disposed.handLimit).toBe(5);
  expect(disposed.handLimitEffects).toHaveLength(0);
});

it('手札枚数変更にスキル増幅を適用して整数化する', () => {
  const state = { ...game(), amplification: 150 };
  const next = applyEffect(state, { kind: 'hand-limit', amount: 3 });
  expect(next.handLimit).toBe(9);
});

it('手札枚数を減らす効果はランダム除外後に発動元を補充しない', () => {
  const state = fillHand(game());
  const source = state.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const activated = {
    ...state,
    hand: state.hand.filter((id) => id !== source.id),
    activation: {
      sourceId: source.id,
      usedCards: [source.id],
      allHand: false,
      recoverDiscard: false,
      returnToDraw: [],
      excluded: [],
      handCountChanges: {},
    },
  };
  const changed = applyEffect(activated, { kind: 'hand-limit', amount: -1 }, source);
  const finished = finishCardActivation(changed, applyEffect);
  expect(finished.hand).toHaveLength(3);
  expect(finished.discard).toHaveLength(2);
  expect(finished.discard).toContain(source.id);
});

it('手札目標数より多い状態では使用元カードを補充しない', () => {
  const state = fillHand({ ...game(), handLimit: 7 });
  const source = state.deck[0];
  if (!source) throw new Error('発動元カードがありません。');
  const activated = {
    ...state,
    handLimit: 5,
    hand: state.hand.filter((id) => id !== source.id),
    activation: {
      sourceId: source.id,
      usedCards: [source.id],
      allHand: false,
      recoverDiscard: false,
      returnToDraw: [],
      excluded: [],
      handCountChanges: {},
    },
  };
  const finished = finishCardActivation(activated, applyEffect);
  expect(finished.hand).toHaveLength(6);
  expect(finished.discard).toContain(source.id);
});

it('手札内の減少効果を合算してから、上限を3〜8枚に制限する', () => {
  const state = game();
  const card = state.deck[0];
  if (!card) throw new Error('カードがありません。');
  const compressed = {
    ...state,
    hand: [card.id],
    drawPile: state.deck.filter((item) => item.id !== card.id).map((item) => item.id),
    discard: [],
    deck: state.deck.map((item) =>
      item.id === card.id ? { ...item, passive: { heartsPercent: 100, handLimitDelta: -3 } } : item,
    ),
  };
  expect(handCapacity(compressed)).toBe(3);
  expect(fillHand(compressed).hand).toHaveLength(3);
  expect(handCapacity({ ...compressed, handLimit: 11 })).toBe(8);
});

it('手札最大化は手札を8枚まで補充し、期限後も保持した手札を減らさない', () => {
  const initial = game();
  const shortHand = {
    ...initial,
    handLimit: 4,
    hand: initial.hand.slice(0, 3),
    drawPile: initial.deck
      .map((card) => card.id)
      .filter((id) => !initial.hand.slice(0, 3).includes(id)),
  };
  const expanded = applyEffect(shortHand, {
    kind: 'hand-max-card',
    duration: { kind: 'sections', value: 1 },
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
    duration: { kind: 'milliseconds', value: 100 },
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
      duration: { kind: 'milliseconds', value: 100 },
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
