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
