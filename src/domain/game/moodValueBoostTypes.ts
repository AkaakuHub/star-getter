import type { HeartLimitBoostTarget } from './heartLimitBoostTypes';

export type MoodValueBoostEffect = Readonly<{
  kind: 'mood-value-boost';
  calculationType: 1 | 2;
  num: number;
  bonusMoodTarget: 0 | 1 | 2 | 3;
  bonusMoodValue: number;
  duration: Readonly<{ kind: 'none' | 'milliseconds' | 'sections' | 'stage'; value: number }>;
  disabledType: number;
  disabledCount: number;
  target: HeartLimitBoostTarget;
  tokenCardSeriesIds?: readonly number[];
  deactivationKey?: string;
}>;

export type MoodValueAdditionalBuff = Readonly<{
  id: number;
  calculation: 'add' | 'multiply2';
  value: number;
  target: HeartLimitBoostTarget;
  paramSeriesIds: readonly number[] | null;
  remainingUses: number;
  remainingDeactivations: number | null;
  remainingSeconds: number | null;
  remainingSections: number | null;
  deactivationKey: string | null;
}>;

export function validateMoodValueBoost(effect: MoodValueBoostEffect): void {
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
    (effect.tokenCardSeriesIds?.some((id) => !Number.isSafeInteger(id)) ?? false) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('空模様追加バフの設定が正しくありません。');
}
