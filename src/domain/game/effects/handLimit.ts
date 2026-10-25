import type { Card, GameState } from '../model';
import { skillValue } from './skillValue';
import { isProxyTargetReached } from './proxySkill';

export function applyHandLimit(
  state: GameState,
  baseAmount: number,
  card: Card | undefined,
  multiplier: number,
  duration: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }> | undefined,
  addValue = 0,
): GameState {
  if (duration?.kind === 'sections' && duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  const scaledAmount = Math.trunc(Math.fround((baseAmount + addValue) * multiplier));
  const amount = Math.trunc(
    skillValue(state, scaledAmount, { kind: 'hand-limit', amount: baseAmount }, card),
  );
  const absorption = amount >= 0 ? absorbHandLimit(state, amount) : null;
  const appliedAmount = absorption?.absorbed ? 0 : amount;
  const activation = state.activation;
  const handLimitEffects =
    amount === 0
      ? state.handLimitEffects
      : [
          ...state.handLimitEffects,
          {
            amount: appliedAmount,
            expirationAmount: -amount,
            remainingSeconds:
              duration?.kind === 'milliseconds' ? Math.fround(duration.value / 1000) : null,
            remainingSections: duration?.kind === 'sections' ? duration.value : null,
          },
        ];
  return {
    ...state,
    handLimit: state.handLimit + appliedAmount,
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
      if (absorption.hasAbsorbLimit && isProxyTargetReached(absorption, effect))
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
