import { type Card, rules } from './model';

export function validateDeck(deck: readonly Card[]): void {
  if (deck.length !== rules.deckSize || new Set(deck.map((card) => card.id)).size !== deck.length) {
    throw new Error('異なる9枚のカードで編成してください。');
  }
  if (new Set(deck.map((card) => card.performer)).size !== 3) {
    throw new Error('3人全員のカードを編成してください。');
  }
  for (const card of deck) {
    validateCard(card);
  }
}

export function validateCard(card: Card): void {
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(card.id) ||
    !card.name.trim() ||
    !/^\/cards\/[a-z0-9/-]+\.png$/.test(card.art) ||
    !Number.isInteger(card.cost) ||
    card.cost < 1 ||
    card.cost > rules.maxEnergy ||
    !Number.isSafeInteger(card.appeal) ||
    card.appeal <= 0 ||
    card.effects.length === 0
  ) {
    throw new Error('カードの設定が正しくありません。');
  }
  for (const effect of card.effects) {
    if (effect.kind === 'collect') continue;
    if (effect.kind === 'boost') {
      if (
        !Number.isFinite(effect.multiplier) ||
        effect.multiplier < 1 ||
        effect.multiplier > 5 ||
        !Number.isFinite(effect.seconds) ||
        effect.seconds <= 0 ||
        effect.seconds > 120
      ) {
        throw new Error('得点倍率と効果時間が正しくありません。');
      }
    } else if (!Number.isSafeInteger(effect.amount) || effect.amount <= 0 || effect.amount > 100) {
      throw new Error('カードの効果量が正しくありません。');
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
