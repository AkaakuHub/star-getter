import { expect, it } from 'vite-plus/test';
import { game, withHandTarget } from '../support/game';
import { withBoardState } from '../support/board';
import { act } from '@akaakuhub/suku-sute-core/game/actions';
import { applyEffect } from '@akaakuhub/suku-sute-core/game/effects';
import { handCardCountEffect } from '@akaakuhub/suku-sute-core/game/actionTypeEffects/handCardCount';
import {
  handCapacity,
  flushHandCardCountActions,
} from '@akaakuhub/suku-sute-core/game/cards/drawing';
import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import {
  advanceHandMaxCardEffects,
  expireHandMaxCardSections,
} from '@akaakuhub/suku-sute-core/game/effects/handMaxCard';

it('手札最大化は手札を8枚まで補充し、期限後も保持した手札を減らさない', () => {
  const initial = game();
  const shortHand = withBoardState(withHandTarget(initial, 4), {
    hand: liveCurrentHandCardInstanceIds(initial).slice(0, 3),
    deck: initial.deck
      .map((card) => card.cardInstanceId)
      .filter((id) => !liveCurrentHandCardInstanceIds(initial).slice(0, 3).includes(id)),
  });
  const expanded = applyEffect(shortHand, {
    kind: 'hand-max-card',
    duration: { kind: 'sections', value: 1n },
  });
  expect(liveCurrentHandCardInstanceIds(expanded)).toHaveLength(8);
  expect(handCapacity(expanded)).toBe(8);
  const expired = expireHandMaxCardSections(expanded);
  expect(expired.handMaxCardEffects).toHaveLength(0);
  expect(liveCurrentHandCardInstanceIds(expired)).toHaveLength(8);
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
    expect(liveCurrentHandCardInstanceIds(ended)).toEqual(liveCurrentHandCardInstanceIds(timed));
  }
});

it('最大化中の枚数変更は共通の現在目標と解除後の保存目標を更新する', () => {
  const initial = withHandTarget(game(), 4);
  const maximum = applyEffect(initial, {
    kind: 'hand-max-card',
    duration: { kind: 'sections', value: 1n },
  });
  const decreased = flushHandCardCountActions(applyEffect(maximum, handCardCountEffect(-2, 3, 0n)));
  expect(decreased.tokenCardDeck.handTargetCounts.current).toBe(8);
  expect(handCapacity(decreased)).toBe(8);
  const expired = expireHandMaxCardSections(decreased);
  expect(expired.tokenCardDeck.maxHandSkillActiveCount).toBe(0);
  expect(expired.tokenCardDeck.handTargetCounts.current).toBe(2);
  expect(handCapacity(expired)).toBe(3);
});
