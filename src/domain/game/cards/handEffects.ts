import type { Card, GameState } from '../model';
import {
  applyParameterValueChange,
  deactivateParameterValueChanges,
} from '../parameters/parameterValueChange';
import { applyEffect } from '../effects';
import { deactivateBeatPointBuffs } from '../effects/beatPointBuff';
import { deactivateHandLimitEffects } from '../effects/handLimit';

export function activateHandPermanentEffects(state: GameState, card: Card): GameState {
  const effects = card.handPermanentEffects;
  if (!effects?.length || state.activeHandPermanentCardIds.includes(card.id)) return state;
  const deactivationKey = `hand-permanent:${card.id}`;
  let next = state;
  for (const effect of effects) {
    next =
      effect.kind === 'parameter-value-change'
        ? applyParameterValueChange(next, card, effect)
        : applyEffect(
            next,
            effect.kind === 'hand-limit'
              ? { ...effect, invocationType: 0x388, deactivationKey }
              : { ...effect, deactivationKey },
            card,
          );
  }
  return {
    ...next,
    activeHandPermanentCardIds: [...state.activeHandPermanentCardIds, card.id],
  };
}

export function disposeHandEffects(state: GameState, ids: readonly string[]): GameState {
  let next = state;
  for (const id of ids) {
    const card = state.deck.find((item) => item.id === id);
    if (!card || card.handUse?.limitMemory === 'retain') continue;
    for (const effect of card.handUse?.effects ?? []) {
      if (effect.kind === 'parameter-value-change')
        next = applyParameterValueChange(next, card, effect, true);
    }
  }
  for (const active of state.activeModeParameterChanges) {
    if (!ids.includes(active.cardId)) continue;
    const card = state.cardPool.find((item) => item.id === active.cardId);
    if (!card?.modeParameterChanges) continue;
    const effects = active.isOn ? card.modeParameterChanges.on : card.modeParameterChanges.off;
    next = deactivateParameterValueChanges(next, card, effects);
  }
  const activeHandPermanentCardIds = state.activeHandPermanentCardIds.filter(
    (id) => !ids.includes(id),
  );
  for (const id of state.activeHandPermanentCardIds) {
    if (!ids.includes(id)) continue;
    const card = state.cardPool.find((item) => item.id === id);
    const effects = card?.handPermanentEffects;
    if (!card || !effects) continue;
    next = deactivateParameterValueChanges(
      next,
      card,
      effects.filter((effect) => effect.kind === 'parameter-value-change'),
    );
    const deactivationKey = `hand-permanent:${card.id}`;
    next = {
      ...next,
      targetBoosts: next.targetBoosts.filter((boost) => boost.deactivationKey !== deactivationKey),
    };
    next = deactivateBeatPointBuffs(next, deactivationKey);
    next = deactivateHandLimitEffects(next, deactivationKey).state;
  }
  return {
    ...next,
    handEffectCardIds: state.handEffectCardIds.filter((id) => !ids.includes(id)),
    activeModeParameterChanges: state.activeModeParameterChanges.filter(
      (item) => !ids.includes(item.cardId),
    ),
    activeHandPermanentCardIds,
    handCollectionActivationCounts: Object.fromEntries(
      Object.entries(state.handCollectionActivationCounts).filter(([id]) => {
        if (!ids.includes(id)) return true;
        return (
          state.deck.find((card) => card.id === id)?.collectionEffects?.limitMemory === 'retain'
        );
      }),
    ),
    handUseActivationCounts: Object.fromEntries(
      Object.entries(state.handUseActivationCounts).filter(([id]) => {
        if (!ids.includes(id)) return true;
        return state.deck.find((card) => card.id === id)?.handUse?.limitMemory === 'retain';
      }),
    ),
    handUseHeartCollectionCounts: Object.fromEntries(
      Object.entries(state.handUseHeartCollectionCounts).filter(([id]) => !ids.includes(id)),
    ),
  };
}
