import type { MemberId, UnitId } from './model';

export type HeartLimitBoostTarget =
  | Readonly<{ kind: 'all' }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'card-series'; seriesId: number }>;

export type HeartLimitBoostEffect = Readonly<{
  kind: 'heart-limit-boost';
  calculationType: 1 | 2;
  num: number;
  bonusMoodTarget: 0 | 1 | 2 | 3;
  bonusMoodValue: number;
  duration: Readonly<{ kind: 'none' | 'milliseconds' | 'sections' | 'stage'; value: number }>;
  disabledType: number;
  disabledCount: number;
  target: HeartLimitBoostTarget;
  deactivationKey?: string;
}>;

export type HeartLimitAdditionalBuff = Readonly<{
  id: number;
  calculation: 'add' | 'multiply2';
  value: number;
  target: HeartLimitBoostTarget;
  remainingUses: number | null;
  remainingSeconds: number | null;
  remainingSections: number | null;
  deactivationKey: string | null;
}>;

export function validateHeartLimitBoost(effect: HeartLimitBoostEffect): void {
  if (
    ![1, 2].includes(effect.calculationType) ||
    !Number.isSafeInteger(effect.num) ||
    !Number.isFinite(effect.bonusMoodValue) ||
    !['none', 'milliseconds', 'sections', 'stage'].includes(effect.duration.kind) ||
    !Number.isSafeInteger(effect.duration.value) ||
    !Number.isSafeInteger(effect.disabledType) ||
    !Number.isSafeInteger(effect.disabledCount) ||
    (effect.target.kind === 'member' && !Number.isSafeInteger(effect.target.member)) ||
    (effect.target.kind === 'unit' && ![1, 2, 3].includes(effect.target.unit)) ||
    (effect.target.kind === 'card-series' && !Number.isSafeInteger(effect.target.seriesId)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('きらめき上限追加バフの設定が正しくありません。');
}
