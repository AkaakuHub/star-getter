import type { Card, Effect, MemberId, UnitId } from './model';
import { isInt64 } from './numeric';

export type AdditionalHeartInduceCondition =
  | Readonly<{ kind: 'all' }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'main-effect'; actionType: number }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>;

export type AdditionalHeartInduceEffect = Readonly<{
  kind: 'additional-heart-induce';
  condition: AdditionalHeartInduceCondition;
  apPower: bigint;
  heartEffect: Extract<Effect, { kind: 'hearts' }>;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: bigint }>;
  invocationType?: number;
  deactivationKey?: string;
}>;

export type AdditionalHeartInducer = Readonly<{
  id: number;
  sourceCardId: string;
  condition: AdditionalHeartInduceCondition;
  apPower: bigint;
  heartEffect: Extract<Effect, { kind: 'hearts' }>;
  addValue: number;
  multiplier: number;
  remainingSeconds: number | null;
  remainingSections: bigint | null;
  deactivationKey: string | null;
}>;

export function validateAdditionalHeartInduceEffect(effect: AdditionalHeartInduceEffect): void {
  if (
    !isInt64(effect.apPower) ||
    !['all', 'member', 'main-effect', 'unit'].includes(effect.condition.kind) ||
    (effect.condition.kind === 'member' && !Number.isSafeInteger(effect.condition.member)) ||
    (effect.condition.kind === 'main-effect' &&
      !Number.isSafeInteger(effect.condition.actionType)) ||
    (effect.condition.kind === 'unit' && ![1, 2, 3].includes(effect.condition.unit)) ||
    !['milliseconds', 'sections', 'stage'].includes(effect.duration.kind) ||
    !isInt64(effect.duration.value) ||
    (effect.heartEffect.lifetimeSeconds !== undefined &&
      !Number.isFinite(effect.heartEffect.lifetimeSeconds)) ||
    (effect.invocationType !== undefined && !Number.isSafeInteger(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('追加きらめき誘発の設定が正しくありません。');
}

export function matchesAdditionalHeartCondition(
  condition: AdditionalHeartInduceCondition,
  card: Card,
): boolean {
  switch (condition.kind) {
    case 'all':
      return true;
    case 'member':
      return card.member === condition.member;
    case 'main-effect':
      return card.mainEffect === condition.actionType;
    case 'unit':
      return card.unit === condition.unit;
  }
}
