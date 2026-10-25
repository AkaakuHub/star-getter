import { validateEffect } from './effectValidation';
import { type Card, costumeIds, rules } from './model';
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
    (card.mainEffect !== undefined && !Number.isSafeInteger(card.mainEffect)) ||
    Object.values(card.appeal).some((value) => !Number.isSafeInteger(value) || value <= 0) ||
    (card.effects.length === 0 && !card.modeSkillChanges) ||
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
    ...(card.modeParameterChanges?.off ?? []),
    ...(card.modeParameterChanges?.on ?? []),
    ...(card.modeSkillChanges?.off.effects ?? []),
    ...(card.modeSkillChanges?.on.effects ?? []),
    ...(card.modeSkillChanges?.off.special?.effects ?? []),
    ...(card.modeSkillChanges?.on.special?.effects ?? []),
    ...(card.handPermanentEffects ?? []),
    ...(card.collectionEffects?.effects ?? []),
  ])
    validateEffect(effect);
  if (card.special) {
    if (!Number.isSafeInteger(card.special.cost) || card.special.cost < 0)
      throw new Error('共鳴の消費量が正しくありません。');
    for (const effect of card.special.effects) validateEffect(effect);
  }
  if (card.modeSkillChanges) {
    if (
      !Number.isSafeInteger(card.modeSkillChanges.modeId) ||
      card.modeSkillChanges.modeId < 1 ||
      !Number.isSafeInteger(card.modeSkillChanges.off.cost) ||
      !Number.isSafeInteger(card.modeSkillChanges.on.cost) ||
      card.modeSkillChanges.off.cost < 0 ||
      card.modeSkillChanges.on.cost < 0 ||
      (card.modeSkillChanges.off.skillIcon !== null &&
        !Number.isSafeInteger(card.modeSkillChanges.off.skillIcon)) ||
      (card.modeSkillChanges.on.skillIcon !== null &&
        !Number.isSafeInteger(card.modeSkillChanges.on.skillIcon)) ||
      (card.modeSkillChanges.off.special !== null &&
        (!Number.isSafeInteger(card.modeSkillChanges.off.special.cost) ||
          card.modeSkillChanges.off.special.cost < 0)) ||
      (card.modeSkillChanges.on.special !== null &&
        (!Number.isSafeInteger(card.modeSkillChanges.on.special.cost) ||
          card.modeSkillChanges.on.special.cost < 0))
    )
      throw new Error('スキルモードの設定が正しくありません。');
    for (const variant of [card.modeSkillChanges.off, card.modeSkillChanges.on]) {
      for (const effect of variant.effects) validateEffect(effect);
      if (variant.special) for (const effect of variant.special.effects) validateEffect(effect);
    }
  }
  if (card.modeParameterChanges) {
    if (
      !Number.isSafeInteger(card.modeParameterChanges.modeId) ||
      card.modeParameterChanges.modeId < 1
    )
      throw new Error('能力モードの設定が正しくありません。');
    for (const effect of [...card.modeParameterChanges.off, ...card.modeParameterChanges.on])
      validateEffect(effect);
  }
}
