import type { Card, GameState } from '../model';
import { skillValue } from './skillValue';

export function applyHandLimit(
  state: GameState,
  baseAmount: number,
  card: Card | undefined,
  multiplier: number,
  duration: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }> | undefined,
): GameState {
  if (duration?.kind === 'sections' && duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  const amount = Math.trunc(
    Math.fround(
      skillValue(state, baseAmount, { kind: 'hand-limit', amount: baseAmount }, card) * multiplier,
    ),
  );
  const activation = state.activation;
  const handLimitEffects =
    amount === 0
      ? state.handLimitEffects
      : [
          ...state.handLimitEffects,
          {
            amount,
            remainingSeconds:
              duration?.kind === 'milliseconds' ? Math.fround(duration.value / 1000) : null,
            remainingSections: duration?.kind === 'sections' ? duration.value : null,
          },
        ];
  return {
    ...state,
    handLimit: state.handLimit + amount,
    handLimitEffects,
    ...(activation && card && amount !== 0
      ? {
          activation: {
            ...activation,
            handCountChanges: { ...activation.handCountChanges, [card.id]: amount },
          },
        }
      : {}),
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
    expiredAmount += effect.amount;
    return [];
  });
  if (expiredAmount === 0) return { state: { ...state, handLimitEffects }, handAdjustment: 0 };
  const resetAmount = -expiredAmount;
  const minimumCorrection = state.handLimit > 3 ? 0 : state.handLimit - 3;
  return {
    state: { ...state, handLimit: state.handLimit + resetAmount, handLimitEffects },
    handAdjustment: Math.max(0, minimumCorrection + resetAmount),
  };
}
