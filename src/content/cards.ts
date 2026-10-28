import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { baseCards } from './baseCards';

export const defaultDeckCardDatasIds = [
  'horizon',
  'library-ensemble',
  'frost-echo',
  'frost-pulse',
  'rain-preparation',
  'sunrise',
  'aurora-ensemble',
  'perennial',
  'camera',
  'class',
];

export function resolveDeck(cardDatasIds: readonly string[]): readonly Card[] {
  return cardDatasIds.map((cardDatasId) => {
    const card = baseCards.find((item) => item.cardDatasId === cardDatasId);
    if (!card) throw new Error('編成のカードがありません。');
    return card;
  });
}
