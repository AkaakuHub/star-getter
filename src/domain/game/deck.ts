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
  for (const effect of [
    ...card.effects,
    ...(card.drawEffects ?? []),
    ...(card.beforeUseEffects ?? []),
    ...(card.handUse?.effects ?? []),
    ...(card.collectionEffects?.effects ?? []),
  ])
    validateEffect(effect);
  if (card.special) {
    if (!Number.isSafeInteger(card.special.cost) || card.special.cost < 0)
      throw new Error('共鳴の消費量が正しくありません。');
    for (const effect of card.special.effects) validateEffect(effect);
  }
}

function validateEffect(effect: Effect): void {
  if (effect.kind === 'search-unit' || effect.kind === 'search-token' || effect.kind === 'search') {
    if (!Number.isSafeInteger(effect.count) || effect.count < 1)
      throw new Error('検索回数が正しくありません。');
    return;
  }
  if (effect.kind === 'mode' || effect.kind === 'mode-reaction') {
    if (!Number.isSafeInteger(effect.modeId) || effect.modeId < (effect.kind === 'mode' ? 0 : 1))
      throw new Error('モードIDが正しくありません。');
    if (effect.kind === 'mode-reaction') {
      if (
        !Number.isFinite(effect.buffNum) ||
        effect.thresholds.some((count) => !Number.isSafeInteger(count) || count < 1)
      )
        throw new Error('モード切替の発動条件が正しくありません。');
      for (const child of effect.effects) validateEffect(child);
    }
    return;
  }
  if (effect.kind === 'branch') {
    for (const child of [...effect.whenTrue, ...effect.whenFalse]) validateEffect(child);
    return;
  }
  if (effect.kind === 'conditional') {
    for (const child of effect.effects) validateEffect(child);
    return;
  }
  if (effect.kind === 'voltage-tier') {
    if (effect.tiers.length !== 1000 / effect.step + 1)
      throw new Error('熱気の段階数が正しくありません。');
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
  if (effect.kind === 'stop-voltage-increase') {
    if (!Number.isSafeInteger(effect.duration.value) || effect.duration.value < 0)
      throw new Error('熱気停止の期限が正しくありません。');
    return;
  }
  if (
    effect.kind === 'amplify' ||
    effect.kind === 'resource-boost' ||
    effect.kind === 'ap-speed' ||
    effect.kind === 'heart-boost'
  ) {
    if (!Number.isFinite(effect.percent)) throw new Error('増幅率が正しくありません。');
    if (
      effect.kind === 'resource-boost' &&
      effect.uses !== null &&
      (!Number.isSafeInteger(effect.uses) || effect.uses < 1)
    )
      throw new Error('増幅回数が正しくありません。');
    return;
  }
  if (effect.kind === 'skill-cooldown') {
    if (!Number.isFinite(effect.ratio) || effect.ratio < 0)
      throw new Error('アクション間隔が正しくありません。');
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
  if (effect.kind === 'energy' && Number.isFinite(effect.amount)) return;
  if (!('amount' in effect) || !Number.isSafeInteger(effect.amount))
    throw new Error('カードの効果量が正しくありません。');
}
