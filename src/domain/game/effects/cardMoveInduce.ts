import type { Card, GameState } from '../model';
import type { CardMoveInduceEffect } from '../induceSkillEffectTypes';
import type { EffectApplier } from './induceSkillEffect';

export function activateCardMoveInduce(
  state: GameState,
  effect: CardMoveInduceEffect,
  card: Card | undefined,
): GameState {
  if (!card) throw new Error('カード移動誘発の発動元カードがありません。');
  const sourceEffectId = `${card.id}:${effect.sourceEffectId}`;
  if (state.cardMoveInducers.some((inducer) => inducer.sourceEffectId === sourceEffectId))
    return state;
  return {
    ...state,
    cardMoveInducers: [
      ...state.cardMoveInducers,
      {
        sourceCardId: card.id,
        sourceEffectId,
        timing: effect.timing,
        limit: effect.limit,
        requireCount: effect.requireCount,
        effects: effect.effects,
        useCount: 0,
        activatedCount: 0,
      },
    ],
  };
}

export function induceCardMoves(
  state: GameState,
  movedCardIds: ReadonlySet<string>,
  apply: EffectApplier,
): GameState {
  let next = state;
  for (const sourceEffectId of state.cardMoveInducers.map((inducer) => inducer.sourceEffectId)) {
    const inducer = next.cardMoveInducers.find((item) => item.sourceEffectId === sourceEffectId);
    if (
      !inducer ||
      inducer.timing !== 'stage-to-graveyard' ||
      !movedCardIds.has(inducer.sourceCardId) ||
      !next.proxyCards.includes(inducer.sourceCardId) ||
      next.skillUseDestinations[inducer.sourceCardId] !== undefined
    )
      continue;
    const useCount = inducer.useCount + 1;
    next = updateInducer(next, sourceEffectId, { ...inducer, useCount });
    if (inducer.limit !== 0 && inducer.limit <= inducer.activatedCount) continue;
    if (inducer.requireCount !== 0 && useCount % inducer.requireCount !== 0) continue;
    if (inducer.effects.length === 0) continue;
    const card = next.cardPool.find((item) => item.id === inducer.sourceCardId);
    if (!card) throw new Error('カード移動誘発の発動元カードがありません。');
    next = updateInducer(next, sourceEffectId, {
      ...inducer,
      useCount,
      activatedCount: inducer.activatedCount + 1,
    });
    for (const effect of inducer.effects) next = apply(next, effect, card);
  }
  return next;
}

function updateInducer(
  state: GameState,
  sourceEffectId: string,
  updated: GameState['cardMoveInducers'][number],
): GameState {
  let replaced = false;
  const cardMoveInducers = state.cardMoveInducers.map((inducer) => {
    if (replaced || inducer.sourceEffectId !== sourceEffectId) return inducer;
    replaced = true;
    return updated;
  });
  return replaced ? { ...state, cardMoveInducers } : state;
}
