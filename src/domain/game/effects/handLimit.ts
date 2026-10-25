import type { Card, Effect, GameState } from '../model';
import { skillValue } from './skillValue';
import { isProxyTargetReached } from './proxySkill';
import { applyAction52SkillBoostForCard } from './action52SkillBoost';

type HandLimitEffect = Extract<Effect, { kind: 'hand-limit' }>;

export function applyHandLimit(
  state: GameState,
  effect: HandLimitEffect,
  card: Card | undefined,
  multiplier: number,
  addValue = 0,
): GameState {
  const baseAmount = effect.amount;
  const duration = effect.duration;
  if (duration?.kind === 'sections' && duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  const scaledAmount = Math.trunc(Math.fround((baseAmount + addValue) * multiplier));
  const skillBoosted = skillValue(
    state,
    scaledAmount,
    { kind: 'hand-limit', amount: baseAmount },
    card,
  );
  const action52 = applyAction52SkillBoostForCard(state, card, skillBoosted);
  const amount = Math.trunc(action52.value);
  const currentState = action52.state;
  const absorption = amount >= 0 ? absorbHandLimit(currentState, amount) : null;
  const appliedAmount = absorption?.absorbed ? 0 : amount;
  const activation = currentState.activation;
  const handLimitEffects =
    amount === 0
      ? currentState.handLimitEffects
      : [
          ...currentState.handLimitEffects,
          {
            amount: appliedAmount,
            expirationAmount: -amount,
            deactivationKey: effect.deactivationKey ?? null,
            remainingSeconds:
              effect.invocationType !== undefined || duration?.kind !== 'milliseconds'
                ? null
                : Math.fround(duration.value / 1000),
            remainingSections:
              effect.invocationType !== undefined || duration?.kind !== 'sections'
                ? null
                : duration.value,
          },
        ];
  return {
    ...currentState,
    handLimit: currentState.handLimit + appliedAmount,
    handLimitEffects,
    ...(activation && card && appliedAmount !== 0
      ? {
          activation: {
            ...activation,
            handCountChanges: { ...activation.handCountChanges, [card.id]: appliedAmount },
          },
        }
      : {}),
    ...(absorption ? { proxyAbsorptions: absorption.absorptions } : {}),
  };
}

export function advanceHandLimitEffects(state: GameState, elapsedSeconds: number): HandLimitExpiry {
  return expireHandLimitEffects(state, (effect) => {
    if (effect.remainingSeconds === null) return effect;
    const remainingSeconds = Math.fround(effect.remainingSeconds - Math.fround(elapsedSeconds));
    return remainingSeconds > 0 ? { ...effect, remainingSeconds } : null;
  });
}

export function expireHandLimitSections(state: GameState): HandLimitExpiry {
  return expireHandLimitEffects(state, (effect) => {
    if (effect.remainingSections === null) return effect;
    const remainingSections = effect.remainingSections - 1;
    return remainingSections > 0 ? { ...effect, remainingSections } : null;
  });
}

export function deactivateHandLimitEffects(
  state: GameState,
  deactivationKey: string,
): HandLimitExpiry {
  const retainedEffects = state.handLimitEffects.filter(
    (effect) => effect.deactivationKey !== deactivationKey,
  );
  if (retainedEffects.length === state.handLimitEffects.length) return { state, handAdjustment: 0 };
  const expiredAmount = state.handLimitEffects
    .filter((effect) => effect.deactivationKey === deactivationKey)
    .reduce((sum, effect) => sum + effect.expirationAmount, 0);
  return restoreHandLimitEffects(state, retainedEffects, expiredAmount);
}

type HandLimitExpiry = Readonly<{ state: GameState; handAdjustment: number }>;

function expireHandLimitEffects(
  state: GameState,
  advance: (
    effect: GameState['handLimitEffects'][number],
  ) => GameState['handLimitEffects'][number] | null,
): HandLimitExpiry {
  let expiredAmount = 0;
  const handLimitEffects = state.handLimitEffects.flatMap((effect) => {
    const next = advance(effect);
    if (next) return [next];
    expiredAmount += effect.expirationAmount;
    return [];
  });
  return restoreHandLimitEffects(state, handLimitEffects, expiredAmount);
}

function restoreHandLimitEffects(
  state: GameState,
  handLimitEffects: GameState['handLimitEffects'],
  expiredAmount: number,
): HandLimitExpiry {
  if (expiredAmount === 0) return { state: { ...state, handLimitEffects }, handAdjustment: 0 };
  const resetAmount = expiredAmount;
  const minimumCorrection = state.handLimit > 3 ? 0 : state.handLimit - 3;
  return {
    state: { ...state, handLimit: state.handLimit + resetAmount, handLimitEffects },
    handAdjustment: Math.max(0, minimumCorrection + resetAmount),
  };
}

function absorbHandLimit(
  state: GameState,
  amount: number,
): Readonly<{ absorptions: GameState['proxyAbsorptions']; absorbed: boolean }> | null {
  for (
    let absorptionIndex = 0;
    absorptionIndex < state.proxyAbsorptions.length;
    absorptionIndex += 1
  ) {
    const absorption = state.proxyAbsorptions[absorptionIndex];
    if (!absorption) continue;
    for (let effectIndex = 0; effectIndex < absorption.effects.length; effectIndex += 1) {
      const effect = absorption.effects[effectIndex];
      if (!effect) continue;
      if (effect.actionType !== 20) continue;
      if (absorption.hasAbsorbLimit && isProxyTargetReached(effect))
        return { absorptions: state.proxyAbsorptions, absorbed: true };
      const totalAmount = effect.totalAmount + BigInt(amount);
      const effects = absorption.effects.map((item, index) =>
        index === effectIndex ? { ...item, totalAmount } : item,
      );
      const absorptions = state.proxyAbsorptions.map((item, index) =>
        index === absorptionIndex ? { ...item, effects } : item,
      );
      return { absorptions, absorbed: true };
    }
  }
  return null;
}
