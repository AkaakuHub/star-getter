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
  const activationCount = state.useInduceActivationCounts[key] ?? 0;
  if (effect.limit !== 0 && activationCount >= effect.limit) return state;
  const next = effect.effects.reduce((current, child) => apply(current, child, card), state);
  return {
    ...next,
    useInduceActivationCounts: {
      ...next.useInduceActivationCounts,
      [key]: activationCount + 1,
    },
  };
}

export function activateUseCountInduce(
  state: GameState,
  effect: Extract<Effect, { kind: 'use-count-induce' }>,
  card: Card | undefined,
  apply: EffectApplier,
): GameState {
  const skillUseCount = Math.max(0, (card ? (state.skillActivationCounts[card.id] ?? 0) : 0) - 1);
  if (effect.requireCount !== 0 && skillUseCount % effect.requireCount !== 0) return state;
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
