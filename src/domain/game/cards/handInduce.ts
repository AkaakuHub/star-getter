import type { Card, Effect, GameState } from '../model';
import type { HandUseTrigger } from './cardTypes';
import type { EffectApplier } from '../effects/induceSkillEffect';

export function notifyHandSkillUse(state: GameState, used: Card, apply: EffectApplier): GameState {
  return activateHandInducers(state, apply, (trigger, source) => {
    switch (trigger.kind) {
      case 'member':
        return trigger.member === used.member;
      case 'skill-icon':
        return trigger.icon === used.skillIcon;
      case 'unit':
        return trigger.unit === used.unit;
      case 'heart-quantity-count':
        return false;
      case 'same-card':
        return source.id === used.id;
      case 'any-skill':
        return true;
      case 'voltage-increase':
      case 'section-change':
        return false;
    }
  });
}

export function notifyHandHeartCollect(
  state: GameState,
  collectedCount: number,
  apply: EffectApplier,
): GameState {
  let next = state;
  const activationCounts = { ...state.handUseActivationCounts };
  const collectionCounts = { ...state.handUseHeartCollectionCounts };
  for (const id of state.handEffectCardIds) {
    const card = state.cardPool.find((item) => item.id === id);
    if (!card) throw new Error('手札効果のカードがありません。');
    const handUse = card.handUse;
    const trigger = handUse?.trigger;
    if (!handUse || !trigger || trigger.kind !== 'heart-quantity-count') continue;
    const count = (collectionCounts[id] ?? 0) + collectedCount;
    collectionCounts[id] = count;
    const activationCount = activationCounts[id] ?? 0;
    if (
      (handUse.limit !== undefined && handUse.limit !== 0 && handUse.limit <= activationCount) ||
      count < trigger.count
    )
      continue;
    collectionCounts[id] = 0;
    next = applyEffects(next, handUse.effects, card, apply);
    activationCounts[id] = activationCount + 1;
  }
  return {
    ...next,
    handUseActivationCounts: activationCounts,
    handUseHeartCollectionCounts: collectionCounts,
  };
}

export function notifyHandVoltageIncrease(
  state: GameState,
  previousLevel: number,
  currentLevel: number,
  apply: EffectApplier,
): GameState {
  let next = state;
  for (let level = 0; level < Math.max(0, currentLevel - previousLevel); level++)
    next = activateHandInducers(next, apply, (trigger) => trigger.kind === 'voltage-increase');
  return next;
}

export function notifyHandSectionChange(state: GameState, apply: EffectApplier): GameState {
  return activateHandInducers(state, apply, (trigger) => trigger.kind === 'section-change');
}

function activateHandInducers(
  state: GameState,
  apply: EffectApplier,
  matches: (trigger: HandUseTrigger, source: Card) => boolean,
): GameState {
  let next = state;
  const activationCounts = { ...state.handUseActivationCounts };
  for (const id of state.handEffectCardIds) {
    const card = state.cardPool.find((item) => item.id === id);
    if (!card) throw new Error('手札効果のカードがありません。');
    const handUse = card.handUse;
    if (!handUse || !handUse.effects.length || !matches(handUse.trigger, card)) continue;
    const activationCount = activationCounts[id] ?? 0;
    if (handUse.limit !== undefined && handUse.limit !== 0 && handUse.limit <= activationCount)
      continue;
    next = applyEffects(next, handUse.effects, card, apply);
    activationCounts[id] = activationCount + 1;
  }
  return { ...next, handUseActivationCounts: activationCounts };
}

function applyEffects(
  state: GameState,
  effects: readonly Effect[],
  card: Card,
  apply: EffectApplier,
): GameState {
  return effects.reduce((next, effect) => {
    const activated = apply(next, effect, card);
    return activated.deckOutCount > 0
      ? { ...activated, deckOutCount: activated.deckOutCount - 1 }
      : activated;
  }, state);
}
