import type { Card, Effect, GameState } from '../model';
import type { ProxySkillEffect } from '../modelTypes';

type ApplyProxyEffect = (
  state: GameState,
  effect: Effect,
  card: Card,
  multiplier: number,
  addValue: number,
) => GameState;

export function registerProxySkill(
  state: GameState,
  effect: ProxySkillEffect,
  card: Card | undefined,
): GameState {
  if (!card) return state;
  if (effect.periodType === 3 ? effect.induceTiming !== 1 : effect.periodParam < 1) return state;
  const periodParam = Math.trunc(effect.periodParam);
  if (periodParam < 1 && effect.periodType !== 3) return state;
  const absorption = {
    id: state.nextProxyAbsorptionId,
    sourceId: card.id,
    hasAbsorbLimit: (effect.absorbLimit & 1) === 1,
    isAbsoluteAdd: (effect.absorbLimit & 2) === 2,
    periodType: effect.periodType,
    remainingPeriod: effect.periodType === 1 ? Math.fround(periodParam / 1000) : periodParam,
    isAbsorbEnd: false,
    induceTiming: effect.induceTiming,
    induceCondition: effect.induceCondition,
    inducePowerType: effect.inducePowerType,
    inducePowerParam: effect.inducePowerParam,
    inducedEffects: effect.effects,
    effects: effect.targets.map((target) => ({
      actionType: signedInt32(target.actionType),
      targetAmount: BigInt(signedInt32(target.targetAmount)),
      totalAmount: 0n,
    })),
  } satisfies GameState['proxyAbsorptions'][number];
  return {
    ...state,
    proxyAbsorptions: [...state.proxyAbsorptions, absorption],
    nextProxyAbsorptionId: state.nextProxyAbsorptionId + 1,
    skillUseDestinations: { ...state.skillUseDestinations, [card.id]: 'proxy' },
  };
}

export function advanceProxySkillPeriods(
  state: GameState,
  elapsedSeconds: number,
  apply: ApplyProxyEffect,
): GameState {
  let next = state;
  for (const initialAbsorption of state.proxyAbsorptions) {
    const absorption = next.proxyAbsorptions.find((item) => item.id === initialAbsorption.id);
    if (!absorption) continue;
    if (absorption.isAbsorbEnd) continue;
    if (absorption.periodType !== 1) continue;
    const remainingPeriod = Math.fround(absorption.remainingPeriod - Math.fround(elapsedSeconds));
    if (remainingPeriod <= 0 && absorption.induceTiming === 3)
      next = endProxyAbsorption(next, absorption);
    else if (remainingPeriod <= 0) next = finishProxyAbsorption(next, absorption, apply);
    else next = updateProxyAbsorptionPeriod(next, absorption, remainingPeriod);
  }
  return next;
}

export function advanceProxySkillSections(state: GameState, apply: ApplyProxyEffect): GameState {
  let next = state;
  for (const initialAbsorption of state.proxyAbsorptions) {
    const absorption = next.proxyAbsorptions.find((item) => item.id === initialAbsorption.id);
    if (!absorption) continue;
    if (absorption.isAbsorbEnd) continue;
    if (absorption.periodType !== 2) continue;
    const remainingPeriod = absorption.remainingPeriod - 1;
    if (remainingPeriod <= 0 && absorption.induceTiming === 1)
      next = endProxyAbsorption(next, absorption);
    else if (remainingPeriod <= 0 && absorption.induceTiming === 3)
      next = endProxyAbsorption(next, absorption);
    else if (remainingPeriod <= 0) next = finishProxyAbsorption(next, absorption, apply);
    else next = updateProxyAbsorptionPeriod(next, absorption, remainingPeriod);
  }
  return next;
}

export function advanceProxySkillUses(
  state: GameState,
  usedSourceId: string,
  skillCost: number,
  apply: ApplyProxyEffect,
): GameState {
  let next = state;
  for (const initialAbsorption of state.proxyAbsorptions) {
    const absorption = next.proxyAbsorptions.find((item) => item.id === initialAbsorption.id);
    if (!absorption) continue;
    if (absorption.isAbsorbEnd) continue;
    if (absorption.sourceId === usedSourceId) continue;
    if (absorption.periodType !== 4 && absorption.periodType !== 5) continue;
    const decrement = absorption.periodType === 4 ? 1 : skillCost;
    const remainingPeriod = absorption.remainingPeriod - decrement;
    if (remainingPeriod <= 0 && absorption.induceTiming === 3)
      next = endProxyAbsorption(next, absorption);
    else if (remainingPeriod <= 0) next = finishProxyAbsorption(next, absorption, apply);
    else next = updateProxyAbsorptionPeriod(next, absorption, remainingPeriod);
  }
  return next;
}

export function isProxyTargetReached(
  absorption: GameState['proxyAbsorptions'][number],
  effect: GameState['proxyAbsorptions'][number]['effects'][number],
): boolean {
  if (effect.actionType === 48 && !absorption.isAbsoluteAdd && effect.targetAmount < 0n)
    return effect.totalAmount <= effect.targetAmount;
  return effect.totalAmount >= effect.targetAmount;
}

export function forceProxySkillActivation(
  state: GameState,
  targetType: 1 | 2 | 3 | 4 | 5,
): GameState {
  return {
    ...state,
    proxyAbsorptions: state.proxyAbsorptions.map((absorption) =>
      matchesForcedActivationTarget(absorption, targetType)
        ? { ...absorption, isAbsorbEnd: true }
        : absorption,
    ),
  };
}

function matchesForcedActivationTarget(
  absorption: GameState['proxyAbsorptions'][number],
  targetType: 1 | 2 | 3 | 4 | 5,
): boolean {
  switch (targetType) {
    case 1:
      return true;
    case 2:
      return absorption.hasAbsorbLimit;
    case 3:
      return !absorption.hasAbsorbLimit;
    case 4:
      return (
        absorption.effects.length > 0 &&
        absorption.effects.every((effect) => isProxyTargetReached(absorption, effect))
      );
    case 5:
      return !(
        absorption.effects.length > 0 &&
        absorption.effects.every((effect) => isProxyTargetReached(absorption, effect))
      );
  }
}

function finishProxyAbsorption(
  state: GameState,
  absorption: GameState['proxyAbsorptions'][number],
  apply: ApplyProxyEffect,
): GameState {
  const checkTargets = absorption.induceTiming === 1 || absorption.induceCondition === 2;
  const allTargetsReached = absorption.effects.every((effect) =>
    isProxyTargetReached(absorption, effect),
  );
  if (checkTargets && !allTargetsReached) return removeProxyAbsorption(state, absorption);
  const card = state.cardPool.find((item) => item.id === absorption.sourceId);
  if (!card) return removeProxyAbsorption(state, absorption);
  let next = updateProxyAbsorption(state, absorption, { ...absorption, isAbsorbEnd: true });
  if (absorption.inducePowerType === 3) {
    let multiplier = 1;
    for (const effect of absorption.effects) {
      const total = Math.fround(Number(effect.totalAmount));
      const target = Math.fround(Number(effect.targetAmount));
      if (total === 0 || target === 0) continue;
      multiplier = Math.fround(multiplier * Math.fround(total / target));
    }
    next = absorption.inducedEffects.reduce(
      (current, child) => apply(current, child.effect, card, multiplier, 0),
      next,
    );
  } else if (absorption.inducePowerType === 2) {
    const power = Math.fround(Math.fround(absorption.inducePowerParam) / 10_000);
    next = absorption.inducedEffects.reduce((current, child) => {
      const match = absorption.effects.find((item) => item.actionType === child.actionType);
      return match
        ? apply(current, child.effect, card, power, Math.fround(Number(match.totalAmount)))
        : apply(current, child.effect, card, 1, 0);
    }, next);
  } else {
    next = absorption.inducedEffects.reduce(
      (current, child) => apply(current, child.effect, card, 1, 0),
      next,
    );
  }
  return removeProxyAbsorption(next, absorption);
}

function endProxyAbsorption(
  state: GameState,
  absorption: GameState['proxyAbsorptions'][number],
): GameState {
  const checkTargets = absorption.induceTiming === 1 || absorption.induceCondition === 2;
  const allTargetsReached = absorption.effects.every((effect) =>
    isProxyTargetReached(absorption, effect),
  );
  if (checkTargets && !allTargetsReached) return removeProxyAbsorption(state, absorption);
  return updateProxyAbsorption(state, absorption, { ...absorption, isAbsorbEnd: true });
}

function updateProxyAbsorptionPeriod(
  state: GameState,
  current: GameState['proxyAbsorptions'][number],
  remainingPeriod: number,
): GameState {
  return updateProxyAbsorption(state, current, { ...current, remainingPeriod });
}

function updateProxyAbsorption(
  state: GameState,
  current: GameState['proxyAbsorptions'][number],
  updated: GameState['proxyAbsorptions'][number],
): GameState {
  let replaced = false;
  const proxyAbsorptions = state.proxyAbsorptions.map((item) => {
    if (replaced || item.id !== current.id) return item;
    replaced = true;
    return updated;
  });
  return replaced ? { ...state, proxyAbsorptions } : state;
}

function removeProxyAbsorption(
  state: GameState,
  absorption: GameState['proxyAbsorptions'][number],
): GameState {
  let removed = false;
  const proxyAbsorptions = state.proxyAbsorptions.filter((item) => {
    if (removed || item.id !== absorption.id) return true;
    removed = true;
    return false;
  });
  return removed ? { ...state, proxyAbsorptions } : state;
}

function signedInt32(value: number): number {
  return Number(BigInt.asIntN(32, BigInt(Math.trunc(value))));
}
