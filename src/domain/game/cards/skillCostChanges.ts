import { voltageLevel } from '../live/voltageLevel';
import { sectionAt, moodValue } from '../projection';
import { skillValue } from '../effects/skillValue';
import type { Card, GameState } from '../model';
import type { SkillCostChange, SkillCostChangeEffect } from '../modelTypes';

export function addSkillCostChange(
  state: GameState,
  effect: SkillCostChangeEffect,
  card: Card | undefined,
  multiplier: number,
): GameState {
  if (!card) throw new Error('発動元カードがありません。');
  const base = Math.fround((effect.amount - (effect.addValue ?? 0)) * multiplier);
  const amount =
    base < 0
      ? Math.trunc(
          -skillValue(state, Math.abs(base), { kind: 'amplify', percent: Math.abs(base) }, card),
        )
      : base;
  const change: SkillCostChange = {
    sourceId: card.id,
    amount,
    minimum: effect.minimum,
    maximum: effect.maximum,
    conditionType: effect.conditionType,
    conditionId: effect.conditionId ?? 0,
    remainingSections:
      effect.invocationType === 0x388 || effect.invocationType === 0x38b
        ? null
        : (effect.duration?.sections ?? null),
    invocationType: effect.invocationType ?? null,
    deactivationKey: effect.deactivationKey ?? null,
  };
  return { ...state, skillCostChanges: [...state.skillCostChanges, change] };
}

export function deactivateSkillCostChanges(state: GameState, deactivationKey: string): GameState {
  return {
    ...state,
    skillCostChanges: state.skillCostChanges.filter(
      (change) =>
        change.deactivationKey !== deactivationKey ||
        change.invocationType === 0x388 ||
        change.invocationType === 0x38b,
    ),
  };
}

export function skillCostDelta(state: GameState, card: Card): number {
  return state.skillCostChanges
    .filter((change) => change.sourceId === card.id)
    .reduce((total, change) => {
      const value = conditionValue(state, card, change);
      const bounded =
        change.conditionType === 1
          ? change.amount
          : Math.max(change.minimum, Math.min(change.maximum, value * change.amount));
      return total + bounded;
    }, 0);
}

export function initializeHandCardStats(state: GameState, ids: readonly string[]): GameState {
  const sectionIndex = state.track.sections.indexOf(sectionAt(state));
  const handCardStats = { ...state.handCardStats };
  for (const id of ids) {
    handCardStats[id] = {
      enteredSectionIndex: sectionIndex,
      cardUseCountsAtEntry: state.cardUseCounts,
    };
  }
  return { ...state, handCardStats };
}

function conditionValue(state: GameState, source: Card, change: SkillCostChange): number {
  const stats = state.handCardStats[source.id];
  const currentHand = state.hand.flatMap((id) => {
    const card = state.deck.find((item) => item.id === id);
    return card ? [card] : [];
  });
  const useCount = (card: Card) =>
    (state.cardUseCounts[card.id] ?? 0) - (stats?.cardUseCountsAtEntry[card.id] ?? 0);
  switch (change.conditionType) {
    case 1:
      return 1;
    case 2:
      return state.cardUseCounts[source.id] ?? 0;
    case 3:
      return voltageLevel(state.excitement, state.maximumVoltageLevel);
    case 4:
      return Math.min(1, Math.trunc(state.stamina) / state.maximumMental);
    case 5:
      return stats ? state.track.sections.indexOf(sectionAt(state)) - stats.enteredSectionIndex : 0;
    case 6:
      return currentHand.reduce(
        (sum, card) => sum + (card.member === change.conditionId ? useCount(card) : 0),
        0,
      );
    case 7:
      return currentHand.reduce(
        (sum, card) => sum + (card.skillIcon === change.conditionId ? useCount(card) : 0),
        0,
      );
    case 8:
      return currentHand.filter((card) => card.mainEffect === change.conditionId).length;
    case 9:
      return state.boosts.reduce((sum, boost) => sum + boost.percent, 0);
    case 10:
      return currentHand.filter((card) => card.style === change.conditionId).length;
    case 11:
      return currentHand.filter((card) => card.member === change.conditionId).length;
    case 12: {
      const mood = moodValue(state);
      return change.conditionId === 2
        ? Math.abs(mood)
        : change.conditionId === 1
          ? Math.max(0, mood)
          : mood > -1
            ? mood
            : -mood;
    }
    case 13:
      return currentHand.reduce(
        (sum, card) => sum + (card.unit === change.conditionId ? useCount(card) : 0),
        0,
      );
    case 14:
      return currentHand.filter((card) => card.unit === change.conditionId).length;
    case 15:
      return state.cardPool.length - state.deck.length;
  }
  throw new Error('スキルコスト条件が正しくありません。');
}
