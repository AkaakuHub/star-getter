import type { Card } from '../domain/game/model';
import { flattenPacks } from '../domain/catalog/packs';
import { packs } from './packs';

export const cards = flattenPacks(packs);

export function cardsInPack(id: string): readonly Card[] {
  if (id === '') return cards;
  const pack = packs.find((item) => item.id === id);
  if (!pack) throw new Error('公開されたパックがありません。');
  return pack.cards;
}

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
