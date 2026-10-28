import { validateDeck } from '@akaakuhub/suku-sute-core/game/deck';
import { rules } from '@akaakuhub/suku-sute-core/game/model';
import { resolveDeck } from '../../content/cards';
import { routes, type RouteId } from '../../content/routes';

export type GameSetup = Readonly<{ presetId: RouteId; cardIds: readonly string[] }>;

export function createPresetSetup(presetId: RouteId): GameSetup {
  return { presetId, cardIds: routes[presetId].deck.map((card) => card.id) };
}

export function setupCards(setup: GameSetup) {
  const cards = resolveDeck(setup.cardIds);
  validateDeck(cards);
  return cards;
}

export function setupProblem(setup: GameSetup): string | null {
  try {
    setupCards(setup);
    return null;
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    return error.message;
  }
}

export function toggleSetupCard(setup: GameSetup, cardId: string): GameSetup {
  resolveDeck([cardId]);
  const cardIds = setup.cardIds.includes(cardId)
    ? setup.cardIds.filter((id) => id !== cardId)
    : [...setup.cardIds, cardId];
  if (cardIds.length > rules.maxDeckSize) throw new Error('編成の上限に達しています。');
  return { ...setup, cardIds };
}

export function moveSetupCard(setup: GameSetup, cardId: string, direction: -1 | 1): GameSetup {
  const index = setup.cardIds.indexOf(cardId);
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= setup.cardIds.length)
    throw new Error('カードの移動先が正しくありません。');
  const cardIds = [...setup.cardIds];
  cardIds.splice(index, 1);
  cardIds.splice(destination, 0, cardId);
  return { ...setup, cardIds };
}
