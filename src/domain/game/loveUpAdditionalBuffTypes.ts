import type { MemberId, UnitId } from './model';

export type LoveUpAdditionalBuffTarget =
  | Readonly<{ kind: 'all' }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'token-series'; seriesId: number }>;

export type LoveUpAdditionalBuff = Readonly<{
  id: number;
  percent: number;
  target: LoveUpAdditionalBuffTarget;
  remainingSeconds: number | null;
  remainingSections: number | null;
  remainingUses: number | null;
  deactivationKey: string | null;
}>;

export type LoveUpAdditionalBuffEffect = Readonly<{
  kind: 'love-up-additional-buff';
  calculation: number;
  num: number;
  target: LoveUpAdditionalBuffTarget;
  moodBonus?: Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  disabledType: number;
  disabledCount: number;
  invocationType?: number;
  deactivationKey?: string;
}>;

export function validateLoveUpAdditionalBuffEffect(effect: LoveUpAdditionalBuffEffect): void {
  if (
    !Number.isSafeInteger(effect.calculation) ||
    !Number.isSafeInteger(effect.num) ||
    !Number.isFinite(effect.duration.value) ||
    effect.duration.value < 0 ||
    (effect.duration.kind === 'sections' && effect.duration.value === 0) ||
    !Number.isSafeInteger(effect.disabledType) ||
    !Number.isSafeInteger(effect.disabledCount) ||
    (effect.invocationType !== undefined && !Number.isSafeInteger(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('STAR追加バフの設定が正しくありません。');
}
