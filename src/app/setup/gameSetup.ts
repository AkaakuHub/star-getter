import { validateDeck } from '@akaakuhub/suku-sute-core/game/deck';
import { rules } from '@akaakuhub/suku-sute-core/game/model';
import { resolveDeck } from '../../content/cards';
import { routes, type RouteId } from '../../content/routes';

export type GameSetup = Readonly<{ presetId: RouteId; cardDatasIds: readonly string[] }>;

export function createPresetSetup(presetId: RouteId): GameSetup {
  return { presetId, cardDatasIds: routes[presetId].deck.map((card) => card.cardDatasId) };
}

export function setupCards(setup: GameSetup) {
  const cards = resolveDeck(setup.cardDatasIds);
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

export function toggleSetupCard(setup: GameSetup, cardDatasId: string): GameSetup {
  resolveDeck([cardDatasId]);
  const cardDatasIds = setup.cardDatasIds.includes(cardDatasId)
    ? setup.cardDatasIds.filter((id) => id !== cardDatasId)
    : [...setup.cardDatasIds, cardDatasId];
  if (cardDatasIds.length > rules.maxDeckSize) throw new Error('編成の上限に達しています。');
  return { ...setup, cardDatasIds };
}

export function moveSetupCard(setup: GameSetup, cardDatasId: string, direction: -1 | 1): GameSetup {
  const index = setup.cardDatasIds.indexOf(cardDatasId);
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= setup.cardDatasIds.length)
    throw new Error('カードの移動先が正しくありません。');
  const cardDatasIds = [...setup.cardDatasIds];
  cardDatasIds.splice(index, 1);
  cardDatasIds.splice(destination, 0, cardDatasId);
  return { ...setup, cardDatasIds };
}
