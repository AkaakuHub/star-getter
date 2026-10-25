import type { Card } from '../domain/game/model';
import { baseCards } from './baseCards';

export const defaultDeckIds = [
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

export function resolveDeck(ids: readonly string[]): readonly Card[] {
  return ids.map((id) => {
    const card = baseCards.find((item) => item.id === id);
    if (!card) throw new Error('編成のカードがありません。');
    return card;
  });
}
