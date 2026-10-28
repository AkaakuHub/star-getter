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
  advanceHandCardCountEffects,
  expireHandCardCountSections,
} from '@akaakuhub/suku-sute-core/game/effects/handCardCount';

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
  const expired = expireHandCardCountSections(expanded);
  expect(expired.handCardCountEffects.effects).toHaveLength(0);
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
  const afterTimer = advanceHandCardCountEffects(second, 0.2);
  expect(afterTimer.handCardCountEffects.effects).toHaveLength(1);
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
    const timed = advanceHandCardCountEffects(activated, 1);
    expect(timed.handCardCountEffects.effects).toHaveLength(1);
    const ended = act(timed, {
      type: 'deactivate-hand-max-card',
      deactivationKey,
    });
    expect(ended.handCardCountEffects.effects).toHaveLength(0);
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
  const expired = expireHandCardCountSections(decreased);
  expect(expired.tokenCardDeck.maxHandSkillActiveCount).toBe(0);
  expect(expired.tokenCardDeck.handTargetCounts.current).toBe(2);
  expect(handCapacity(expired)).toBe(3);
});

it('枚数変更と最大化の期限を一つの状態で進め、保存した目標を復元する', () => {
  const count = flushHandCardCountActions(applyEffect(game(), handCardCountEffect(1, 1, 1000n)));
  const maximum = applyEffect(count, {
    kind: 'hand-max-card',
    duration: { kind: 'milliseconds', value: 2000n },
  });
  expect(maximum.handCardCountEffects.effects.map((effect) => effect.kind)).toEqual([
    'count',
    'max',
  ]);
  const afterCount = flushHandCardCountActions(advanceHandCardCountEffects(maximum, 1));
  expect(afterCount.handCardCountEffects.effects).toMatchObject([
    { kind: 'max', duration: { kind: 'milliseconds', remainingSeconds: 1 } },
  ]);
  expect(afterCount.tokenCardDeck.handMaxCardSkillInfo?.targetHandCount).toBe(5);
  expect(afterCount.tokenCardDeck.handTargetCounts.current).toBe(8);
  const afterMaximum = advanceHandCardCountEffects(afterCount, 1);
  expect(afterMaximum.handCardCountEffects.effects).toEqual([]);
  expect(afterMaximum.tokenCardDeck.handTargetCounts.current).toBe(5);
});
