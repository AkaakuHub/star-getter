import { beginTokenGeneration, finishTokenGeneration } from './cards/tokens';
import type { Card, GameState } from './model';
import { applyEffect } from './effects';
import { spendEnergy } from './resources';
import { flushDeckActions } from './cards/boardActions';
import { fillHand } from './cards/drawing';
import { resolveModeSkill } from './live/modes';
import { startSpecialAppealTokenCooldown } from './effects/specialAppealToken';

export function specialCards(state: GameState): readonly Card[] {
  const regularCards = state.deck
    .map((card) => resolveModeSkill(card, state.modes))
    .filter((card, index) => card.special && (index === 0 || card.special.extra));
  const tokenCards = state.specialAppealTokens.map(({ card }) =>
    resolveModeSkill(card, state.modes),
  );
  return [...regularCards, ...tokenCards];
}

export function specialCost(card: Card): number {
  if (!card.special) throw new Error('共鳴の効果がありません。');
  return card.special.cost;
}

export function isBloomSpecial(card: Card): boolean {
  return card.special?.effects.some((effect) => effect.kind === 'bloom') ?? false;
}

export function canUseSpecial(state: GameState, cardId: string): boolean {
  const card = specialCards(state).find((item) => item.id === cardId);
  const token = state.specialAppealTokens.find((item) => item.card.id === cardId);
  return Boolean(
    card?.special &&
    (state.phase === 'playing' || state.phase === 'paused') &&
    !state.resting &&
    (token ? token.remainingCoolTime <= 0 : !state.specialUsed.includes(cardId)) &&
    (state.bloom || state.energy >= specialCost(card)),
  );
}

export function hasAvailableSpecial(state: GameState): boolean {
  return specialCards(state).some((card) => canUseSpecial(state, card.id));
}

export function specialButtonCard(state: GameState): Card | undefined {
  const cards = specialCards(state);
  return (
    cards.find((card) => canUseSpecial(state, card.id)) ??
    cards.find(
      (card) =>
        state.specialAppealTokens.some((token) => token.card.id === card.id) ||
        !state.specialUsed.includes(card.id),
    ) ??
    cards[0]
  );
}

export function useSpecial(state: GameState, cardId: string): GameState {
  if (state.phase !== 'playing' || !canUseSpecial(state, cardId)) return state;
  const card = specialCards(state).find((item) => item.id === cardId);
  const token = state.specialAppealTokens.find((item) => item.card.id === cardId);
  if (!card?.special) throw new Error('共鳴のカードがありません。');
  const previousSkillType = state.currentSkillType;
  let next = beginTokenGeneration(
    { ...spendEnergy(state, specialCost(card)), currentSkillType: 1 },
    card.id,
  );
  next = {
    ...next,
    skillActivationCounts: {
      ...next.skillActivationCounts,
      [card.id]: Number(BigInt.asIntN(32, BigInt((next.skillActivationCounts[card.id] ?? 0) + 1))),
    },
  };
  for (const effect of card.special.effects) next = applyEffect(next, effect, card);
  next = finishTokenGeneration(next, card.id);
  if (token) next = startSpecialAppealTokenCooldown(next, token);
  const completed = flushDeckActions({
    ...next,
    currentSkillType: previousSkillType,
    specialUsed: token
      ? next.specialUsed
      : [...next.specialUsed.filter((id) => id !== cardId), cardId],
    stats: { ...next.stats, specialsUsed: next.stats.specialsUsed + 1 },
  });
  return fillHand(completed);
}
