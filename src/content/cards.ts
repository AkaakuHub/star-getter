import type { Card } from '../domain/game/model';
import { baseCards } from './baseCards';

const cards = baseCards;

export const defaultDeckIds = [
  'spark',
  'flare',
  'sunrise',
  'ripple',
  'tide',
  'prism',
  'bounce',
  'orbit',
  'comet',
];

export function resolveDeck(ids: readonly string[]): readonly Card[] {
  return ids.map((id) => {
    const card = cards.find((item) => item.id === id);
    if (!card) throw new Error('編成のカードがありません。');
    return card;
  });
}
