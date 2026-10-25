import type { Card, Effect, GameState } from '../model';
import type { EffectApplier } from './induceSkillEffect';

export function activateUseInduce(
  state: GameState,
  effect: Extract<Effect, { kind: 'use-induce' }>,
  card: Card | undefined,
  apply: EffectApplier,
): GameState {
  if (!effect.effects.length) return state;
  const key = `${card?.id ?? ''}:${effect.sourceEffectId}`;
  const activationCount = int32(state.useInduceActivationCounts[key] ?? 0);
  const limit = int32(effect.limit);
  if (limit !== 0 && activationCount >= limit) return state;
  const next = effect.effects.reduce((current, child) => apply(current, child, card), state);
  return {
    ...next,
    useInduceActivationCounts: {
      ...next.useInduceActivationCounts,
      [key]: int32(activationCount + 1),
    },
  };
}

function int32(value: number): number {
  return Number(BigInt.asIntN(32, BigInt(Math.trunc(value))));
}

export function activateUseCountInduce(
  state: GameState,
  effect: Extract<Effect, { kind: 'use-count-induce' }>,
  card: Card | undefined,
  apply: EffectApplier,
): GameState {
  const skillUseCount = Math.max(
    0,
    int32(card ? (state.skillActivationCounts[card.id] ?? 0) : 0) - 1,
  );
  const requireCount = int32(effect.requireCount);
  if (requireCount !== 0 && skillUseCount % requireCount !== 0) return state;
  return activateUseInduce(
    state,
    {
      kind: 'use-induce',
      sourceEffectId: effect.sourceEffectId,
      limit: effect.limit,
      effects: effect.effects,
    },
    card,
    apply,
  );
}
