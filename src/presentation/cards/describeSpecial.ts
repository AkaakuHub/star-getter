import type { Card } from '../../domain/game/model';
import { describeEffect } from './describeEffect';

export function describeSpecial(card: Card): string {
  if (!card.special) throw new Error('共鳴の効果がありません。');
  return card.special.effects.map(describeEffect).join('');
}
