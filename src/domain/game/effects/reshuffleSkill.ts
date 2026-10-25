import type { Card, GameState } from '../model';
import type { ReshuffleSkillEffect } from '../reshuffleSkillTypes';
import { enqueueHandShuffle } from '../cards/boardActions';

export function activateReshuffleSkill(
  state: GameState,
  effect: ReshuffleSkillEffect,
  card: Card | undefined,
): GameState {
  return enqueueHandShuffle(
    state,
    {
      recoverDiscard: effect.recoveryType === 1,
      destination: effect.stashType === 1 ? 'draw' : 'discard',
    },
    card?.id ?? null,
    true,
  );
}
