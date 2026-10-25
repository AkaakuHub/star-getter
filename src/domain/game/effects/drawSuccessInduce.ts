import { sectionAt, sectionNumber, moodValue } from '../projection';
import { voltageLevel } from '../live/voltageLevel';
import type { Card, GameState } from '../model';
import type { DrawSuccessInduceEffect } from '../drawSuccessInduceTypes';
import type { EffectApplier } from './induceSkillEffect';
import { deactivateInducedEffects, withDeactivationKey } from './effectInduce';

export function evaluateDrawSuccessInduce(
  state: GameState,
  isActive: boolean,
  branchTypeValue: bigint,
  branchValue: bigint,
): boolean {
  const branchType = int32(branchTypeValue);
  if (branchType === 1 || branchType === 3 || (isActive && (branchType === 2 || branchType === 5)))
    return true;
  switch (branchType) {
    case 2: {
      const numToValue = Math.fround(Math.fround(Number(branchValue)) / 10_000);
      const factor = Math.fround(numToValue / 100);
      const currentPercent = Math.fround(Math.trunc(state.stamina) / state.maximumMental);
      return currentPercent <= factor;
    }
    case 4: {
      const numToValue = Math.fround(Math.fround(Number(branchValue)) / 10_000);
      return moodValue(state) <= numToValue;
    }
    case 5: {
      const numToValue = Math.fround(Math.fround(Number(branchValue)) / 10_000);
      return voltageLevel(state.excitement, state.maximumVoltageLevel) <= numToValue;
    }
    case 6:
      return BigInt(state.track.sections.indexOf(sectionAt(state)) + 1) <= branchValue;
    case 7:
      return BigInt(sectionNumber(state)) === branchValue;
    default:
      return false;
  }
}

export function activateDrawSuccessInduce(
  state: GameState,
  effect: DrawSuccessInduceEffect,
  card: Card | undefined,
  apply: EffectApplier,
): GameState {
  if (!card) return state;
  const handCardStats =
    state.activation?.handCardStatsAtUse[card.id] ?? state.handCardStats[card.id];
  if (!handCardStats) return state;
  const condition = evaluateDrawSuccessInduce(
    state,
    handCardStats.isActive,
    effect.branchType,
    effect.branchValue,
  );
  const selected = condition ? effect.whenTrue : effect.whenFalse;
  if (selected.length === 0) return state;
  const branchType = int32(effect.branchType);
  const disabledType =
    effect.disabledType === undefined ? (branchType === 3 ? 1 : 0) : int32(effect.disabledType);
  const deactivationKey = `${card.id}:${effect.sourceEffectId}`;
  const applied = selected.reduce(
    (next, child) =>
      apply(next, disabledType === 1 ? child : withDeactivationKey(child, deactivationKey), card),
    state,
  );
  if (disabledType === 1) return applied;
  const activation = applied.activation;
  if (!activation) return deactivateInducedEffects(applied, deactivationKey);
  return {
    ...applied,
    activation: {
      ...activation,
      pendingHandStatsDeactivationKeys: [
        ...(activation.pendingHandStatsDeactivationKeys ?? []),
        deactivationKey,
      ],
    },
  };
}

function int32(value: bigint): number {
  return Number(BigInt.asIntN(32, value));
}
