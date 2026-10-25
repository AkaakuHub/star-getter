import { moodValue } from './projection';
import { collectHearts } from './hearts';
import { type Action, type Card, type GameState, rules } from './model';
import { applyEffect, changeResource } from './effects';
import { canUseCard, cardAt } from './projection';
import { cardCost } from './cards/cost';
import { fillHand } from './cards/drawing';

export function act(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start':
      return state.phase === 'ready' ? { ...state, phase: 'playing' } : state;
    case 'pause':
      return state.phase === 'playing' ? { ...state, phase: 'paused' } : state;
    case 'resume':
      return state.phase === 'paused' ? { ...state, phase: 'playing' } : state;
    case 'collect':
      return state.phase === 'playing' ? collectHearts(state) : state;
    case 'special':
      return useSpecial(state);
    case 'card':
      return useCard(state, action.index);
  }
}

function useCard(state: GameState, index: number): GameState {
  if (!canUseCard(state, index)) return state;
  const source = cardAt(state, index);
  const queue = source.effects.some((effect) => effect.kind === 'use-hand')
    ? [source.id, ...state.hand.filter((id) => id !== source.id)]
    : [source.id];
  let next = state.bloom
    ? state
    : changeResource(state, 'energy', -BigInt(cardCost(state, source)));
  for (const id of queue) {
    const card = next.deck.find((item) => item.id === id);
    if (!card) continue;
    const handIndex = state.hand.indexOf(id);
    next = {
      ...next,
      charge: Math.min(100, next.charge + 8),
      lastActionTick: state.tick,
      lastPerformer: card.performer,
      lastCardName: card.name,
      nextDrawPreference: card.drawPreference ?? next.nextDrawPreference,
      stats: { ...next.stats, cardsUsed: next.stats.cardsUsed + 1 },
      cardUses: [
        ...next.cardUses,
        {
          key: next.stats.cardsUsed + 1,
          card,
          tick: state.tick,
          handIndex,
          handCount: state.hand.length,
          cost: cardCost(state, card),
        },
      ],
    };
    next = retireCard(next, card);
    if (card.useAbility === 'story-boost') {
      const count = next.deck.length;
      const percent =
        count >= 100
          ? 1001
          : count >= 80
            ? 700
            : count >= 60
              ? 500
              : count >= 40
                ? 300
                : count >= 20
                  ? 200
                  : 100;
      next = {
        ...next,
        storyAmplification: Math.fround(
          next.storyAmplification + percent + Math.max(0, moodValue(next)) * percent * 0.005,
        ),
      };
    }
    for (const effect of card.effects)
      if (effect.kind !== 'use-hand') next = applyEffect(next, effect, card);
    if (card.exhausts) next = { ...next, deck: next.deck.filter((item) => item.id !== card.id) };
  }
  return fillHand(next);
}

function retireCard(state: GameState, card: Card): GameState {
  return {
    ...state,
    hand: state.hand.filter((id) => id !== card.id),
    drawPile: state.drawPile.filter((id) => id !== card.id),
    discard: card.exhausts
      ? state.discard.filter((id) => id !== card.id)
      : [...state.discard.filter((id) => id !== card.id), card.id],
    relayUsed: state.relayUsed.filter((id) => id !== card.id),
    handHeartCollectCounts: Object.fromEntries(
      Object.entries(state.handHeartCollectCounts).filter(([id]) => id !== card.id),
    ),
  };
}

function useSpecial(state: GameState): GameState {
  if (state.phase !== 'playing' || state.charge < 100 || state.resting) return state;
  const next = applyEffect(
    applyEffect(
      {
        ...state,
        charge: 0,
        boosts: [
          ...state.boosts,
          {
            percent: (80 * state.amplification) / 100,
            untilTick: state.tick + 8 * rules.ticksPerSecond,
          },
        ],
        stats: { ...state.stats, specialsUsed: state.stats.specialsUsed + 1 },
      },
      { kind: 'energy', amount: 3 },
    ),
    { kind: 'stamina', amount: 10 },
  );
  return applyEffect(next, { kind: 'hearts', amount: 8 });
}
