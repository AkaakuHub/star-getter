import { validateCard } from '../game/deck';
import type { Card } from '../game/model';

export type CardPack = Readonly<{
  id: string;
  name: string;
  releasedOn: string;
  cards: readonly Card[];
}>;

export function flattenPacks(packs: readonly CardPack[]): readonly Card[] {
  const packIds = new Set<string>();
  const cardIds = new Set<string>();
  const cards: Card[] = [];
  let previousRelease = '';
  for (const pack of packs) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pack.id) || !pack.name.trim() || packIds.has(pack.id)) {
      throw new Error('パックのIDと名前を確認してください。');
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(pack.releasedOn) ||
      !Number.isFinite(Date.parse(pack.releasedOn)) ||
      new Date(pack.releasedOn).toISOString().slice(0, 10) !== pack.releasedOn ||
      pack.releasedOn < previousRelease ||
      pack.cards.length === 0
    ) {
      throw new Error('パックの公開日と登録順を確認してください。');
    }
    packIds.add(pack.id);
    previousRelease = pack.releasedOn;
    for (const card of pack.cards) {
      validateCard(card);
      if (cardIds.has(card.id)) throw new Error(`カードIDが重複しています: ${card.id}`);
      cardIds.add(card.id);
      cards.push(card);
    }
  }
  if (!cards.length) throw new Error('公開パックがありません。');
  return cards;
}
