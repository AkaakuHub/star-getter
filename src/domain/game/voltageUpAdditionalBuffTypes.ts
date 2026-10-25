import type { MemberId, UnitId } from './model';

export type VoltageUpAdditionalBuffTarget =
  | Readonly<{ kind: 'all' }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'token-series'; seriesId: number }>;

export type VoltageUpAdditionalBuff = Readonly<{
  id: number;
  percent: number;
  target: VoltageUpAdditionalBuffTarget;
  remainingSeconds: number | null;
  remainingSections: number | null;
  deactivationKey: string | null;
}>;

export type VoltageUpAdditionalBuffEffect = Readonly<{
  kind: 'voltage-up-additional-buff';
  calculation: number;
  num: number;
  target: VoltageUpAdditionalBuffTarget;
  moodBonus?: Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  disabledType: number;
  disabledCount: number;
  invocationType?: number;
  deactivationKey?: string;
}>;

export function validateVoltageUpAdditionalBuffEffect(effect: VoltageUpAdditionalBuffEffect): void {
  if (
    !Number.isSafeInteger(effect.calculation) ||
    !Number.isSafeInteger(effect.num) ||
    !Number.isSafeInteger(effect.duration.value) ||
    (effect.duration.kind === 'sections' && effect.duration.value === 0) ||
    !validTarget(effect.target) ||
    (effect.moodBonus !== undefined && !Number.isFinite(effect.moodBonus.perPoint)) ||
    !Number.isSafeInteger(effect.disabledType) ||
    !Number.isSafeInteger(effect.disabledCount) ||
    (effect.invocationType !== undefined && !Number.isSafeInteger(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('熱気追加バフの設定が正しくありません。');
}

function validTarget(target: VoltageUpAdditionalBuffTarget): boolean {
  switch (target.kind) {
    case 'all':
      return true;
    case 'member':
      return Number.isSafeInteger(target.member);
    case 'unit':
      return Number.isSafeInteger(target.unit) && [1, 2, 3].includes(target.unit);
    case 'token-series':
      return Number.isSafeInteger(target.seriesId);
  }
}
