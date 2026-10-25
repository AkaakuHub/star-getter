import { type Card, type Effect, costumeIds, rules } from './model';

export function validateDeck(deck: readonly Card[]): void {
  if (
    deck.length < 3 ||
    deck.length > rules.maxDeckSize ||
    new Set(deck.map((card) => card.id)).size !== deck.length
  ) {
    throw new Error('編成の枚数またはカードの識別子が正しくありません。');
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
  if (card.special) {
    if (!Number.isSafeInteger(card.special.cost) || card.special.cost < 0)
      throw new Error('共鳴の消費量が正しくありません。');
    for (const effect of card.special.effects) validateEffect(effect);
  }
}

function validateEffect(effect: Effect): void {
  if (effect.kind === 'conditional') {
    for (const child of effect.effects) validateEffect(child);
    return;
  }
  if (effect.kind === 'voltage-tier') {
    if (effect.tiers.length !== 6) throw new Error('熱気の段階数が正しくありません。');
    for (const tier of effect.tiers) for (const child of tier) validateEffect(child);
    return;
  }
  if (
    effect.kind === 'collect' ||
    effect.kind === 'shuffle' ||
    effect.kind === 'use-hand' ||
    effect.kind === 'reset-special' ||
    effect.kind === 'protect-mental'
  )
    return;
  if (effect.kind === 'tokens') {
    if (!Number.isSafeInteger(effect.count) || effect.count < 1)
      throw new Error('追加カードの枚数が正しくありません。');
    return;
  }
  if (effect.kind === 'amplify' || effect.kind === 'resource-boost' || effect.kind === 'ap-speed') {
    if (!Number.isFinite(effect.percent)) throw new Error('増幅率が正しくありません。');
    if (effect.kind === 'resource-boost' && (!Number.isSafeInteger(effect.uses) || effect.uses < 1))
      throw new Error('増幅回数が正しくありません。');
    return;
  }
  if (effect.kind === 'bloom') {
    if (!Number.isFinite(effect.strength) || effect.strength < 0)
      throw new Error('開花の効果量が正しくありません。');
    return;
  }
  if (effect.kind === 'boost') {
    if (!Number.isFinite(effect.multiplier) || effect.multiplier < 1)
      throw new Error('得点倍率と効果時間が正しくありません。');
    return;
  }
  if (!('amount' in effect) || !Number.isSafeInteger(effect.amount))
    throw new Error('カードの効果量が正しくありません。');
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
