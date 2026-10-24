import { type Card, rules } from './model';

export function validateDeck(deck: readonly Card[]): void {
  if (deck.length !== rules.deckSize || new Set(deck.map((card) => card.id)).size !== deck.length) {
    throw new Error('異なる9枚のカードで編成してください。');
  }
  if (new Set(deck.map((card) => card.performer)).size !== 3) {
    throw new Error('3人全員のカードを編成してください。');
  }
  for (const card of deck) {
    if (
      !card.id ||
      !Number.isInteger(card.cost) ||
      card.cost < 1 ||
      card.cost > rules.maxEnergy ||
      !Number.isFinite(card.appeal) ||
      card.appeal <= 0
    ) {
      throw new Error('カードの設定が正しくありません。');
    }
  }
}

export function shuffle<T>(
  items: readonly T[],
  seed: number,
): Readonly<{ items: T[]; seed: number }> {
  let nextSeed = seed >>> 0;
  if (nextSeed === 0) throw new Error('乱数seedは0以外にしてください。');
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    nextSeed ^= nextSeed << 13;
    nextSeed ^= nextSeed >>> 17;
    nextSeed ^= nextSeed << 5;
    nextSeed >>>= 0;
    const selected = Math.floor((nextSeed / 0x1_0000_0000) * (index + 1));
    const left = result[index];
    const right = result[selected];
    if (left === undefined || right === undefined)
      throw new Error('山札の位置が正しくありません。');
    result[index] = right;
    result[selected] = left;
  }
  return { items: result, seed: nextSeed };
}
