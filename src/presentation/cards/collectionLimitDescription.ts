import type { Card } from '@akaakuhub/suku-sute-core/game/model';

export function collectionLimitDescription(
  effects: NonNullable<Card['collectionEffects']>,
): string {
  if (effects.limit === undefined || effects.limit === 0) return '回数制限なし';
  return `${effects.limitMemory === 'retain' ? 'ライブ中に' : ''}最大${effects.limit}回`;
}
