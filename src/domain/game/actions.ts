import { shuffle } from './deck';
import { collectHearts } from './hearts';
import { type Action, type GameState, rules } from './model';
import { applyEffect, changeResource } from './effects';
import { canUseCard, cardAt } from './projection';

export function act(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start':
      return state.phase === 'ready' ? { ...state, phase: 'playing' } : state;
    case 'pause':
      return state.phase === 'playing' ? { ...state, phase: 'paused' } : state;
    case 'resume':
      return state.phase === 'paused' ? { ...state, phase: 'playing' } : state;
    case 'collect':
      return state.phase === 'playing' ? collectHearts(state, state.hearts.length) : state;
    case 'special':
      return useSpecial(state);
    case 'card':
      return useCard(state, action.index);
  }
}

function useCard(state: GameState, index: number): GameState {
  if (!canUseCard(state, index)) return state;
  const card = cardAt(state, index);
  let next: GameState = {
    ...state,
    charge: Math.min(100, state.charge + 8),
    lastActionTick: state.tick,
    lastPerformer: card.performer,
    lastCardName: card.name,
    stats: { ...state.stats, cardsUsed: state.stats.cardsUsed + 1 },
  };
  next = changeResource(next, 'energy', -BigInt(card.cost));
  for (const effect of card.effects) next = applyEffect(next, effect);
  return replaceCard(next, index, card.id);
}

function replaceCard(state: GameState, index: number, usedId: string): GameState {
  let drawPile = state.drawPile;
  let discard = [...state.discard, usedId];
  let randomSeed = state.randomSeed;
  if (!drawPile.length) {
    const shuffled = shuffle(discard, randomSeed);
    drawPile = shuffled.items;
    randomSeed = shuffled.seed;
    discard = [];
  }
  const drawn = drawPile[0];
  if (!drawn) throw new Error('補充するカードがありません。');
  return {
    ...state,
    randomSeed,
    discard,
    drawPile: drawPile.slice(1),
    hand: state.hand.map((id, handIndex) => (handIndex === index ? drawn : id)),
    relayUsed: state.relayUsed.filter((id) => id !== drawn),
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
            percent: (80n * state.amplification) / 100n,
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
