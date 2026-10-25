import { type Card, type Effect, costumeIds, rules } from './model';

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
    !costumeIds.includes(card.costume) ||
    !Number.isInteger(card.cost) ||
    card.cost < 0 ||
    card.cost > rules.maxEnergy ||
    Object.values(card.appeal).some((value) => !Number.isSafeInteger(value) || value <= 0) ||
    card.effects.length === 0 ||
    (card.relay !== undefined &&
      (!Number.isSafeInteger(card.relay.threshold) ||
        card.relay.threshold < 1 ||
        !Number.isSafeInteger(card.relay.hearts) ||
        card.relay.hearts < 1))
  ) {
    throw new Error('カードの設定が正しくありません。');
  }
  for (const effect of card.effects) validateEffect(effect);
}

function validateEffect(effect: Effect): void {
  if (effect.kind === 'conditional') {
    for (const child of effect.effects) validateEffect(child);
    return;
  }
  if (effect.kind === 'collect' || effect.kind === 'shuffle' || effect.kind === 'use-hand') return;
  if (effect.kind === 'tokens') {
    if (!Number.isSafeInteger(effect.count) || effect.count < 1 || effect.count > 30)
      throw new Error('追加カードの枚数が正しくありません。');
    return;
  }
  if (effect.kind === 'hand-limit' || effect.kind === 'heart-limit') {
    if (!Number.isSafeInteger(effect.amount) || effect.amount < 1 || effect.amount > 1000)
      throw new Error('上限の増加量が正しくありません。');
    return;
  }
  if (effect.kind === 'amplify' || effect.kind === 'resource-boost') {
    if (!Number.isSafeInteger(effect.percent) || effect.percent <= 0 || effect.percent > 3000)
      throw new Error('増幅率が正しくありません。');
    if (
      effect.kind === 'resource-boost' &&
      (!Number.isSafeInteger(effect.uses) || effect.uses < 1 || effect.uses > 10)
    )
      throw new Error('増幅回数が正しくありません。');
    return;
  }
  if (effect.kind === 'bloom') {
    if (!Number.isFinite(effect.strength) || effect.strength < 1 || effect.strength > 300)
      throw new Error('開花の効果量が正しくありません。');
    return;
  }
  if (effect.kind === 'boost') {
    if (
      !Number.isFinite(effect.multiplier) ||
      effect.multiplier < 1 ||
      effect.multiplier > 31 ||
      !Number.isFinite(effect.seconds) ||
      effect.seconds <= 0 ||
      effect.seconds > 120
    ) {
      throw new Error('得点倍率と効果時間が正しくありません。');
    }
  } else if (
    !('amount' in effect) ||
    !Number.isSafeInteger(effect.amount) ||
    effect.amount <= 0 ||
    effect.amount >
      (effect.kind === 'beat-hearts' ? 3000 : effect.kind === 'excitement' ? 3000 : 100)
  ) {
    throw new Error('カードの効果量が正しくありません。');
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
