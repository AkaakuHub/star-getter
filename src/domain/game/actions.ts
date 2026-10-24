import { shuffle } from './deck';
import { addHearts, collectHearts } from './hearts';
import { type Action, type Effect, type GameState, rules } from './model';
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
    energy: state.energy - card.cost,
    charge: Math.min(100, state.charge + 8),
    lastActionTick: state.tick,
    lastPerformer: card.performer,
    lastCardName: card.name,
    stats: { ...state.stats, cardsUsed: state.stats.cardsUsed + 1 },
  };
  for (const effect of card.effects) next = applyEffect(next, effect);
  return replaceCard(next, index, card.id);
}

function applyEffect(state: GameState, effect: Effect): GameState {
  switch (effect.kind) {
    case 'hearts':
      return addHearts(state, effect.amount);
    case 'energy':
      return { ...state, energy: Math.min(rules.maxEnergy, state.energy + effect.amount) };
    case 'stamina':
      return { ...state, stamina: Math.min(100, state.stamina + effect.amount) };
    case 'excitement':
      return { ...state, excitement: Math.min(100, state.excitement + effect.amount) };
    case 'collect':
      return collectHearts(state, state.hearts.length);
    case 'boost':
      return {
        ...state,
        boosts: [
          ...state.boosts,
          {
            multiplier: effect.multiplier,
            untilTick: state.tick + Math.round(effect.seconds * rules.ticksPerSecond),
          },
        ],
      };
  }
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
  };
}

function useSpecial(state: GameState): GameState {
  if (state.phase !== 'playing' || state.charge < 100 || state.resting) return state;
  return addHearts(
    {
      ...state,
      charge: 0,
      energy: Math.min(rules.maxEnergy, state.energy + 3),
      stamina: Math.min(100, state.stamina + 10),
      boosts: [
        ...state.boosts,
        { multiplier: 1.8, untilTick: state.tick + 8 * rules.ticksPerSecond },
      ],
      stats: { ...state.stats, specialsUsed: state.stats.specialsUsed + 1 },
    },
    8,
  );
}
