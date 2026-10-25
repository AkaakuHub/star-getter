export type DisableMentalDown = Readonly<{
  id: number;
  remainingSeconds: number | null;
  remainingSections: number | null;
  deactivationKey: string | null;
}>;

export type DisableMentalDownEffect = Readonly<{
  kind: 'disable-mental-down';
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  invocationType?: number;
  deactivationKey?: string;
}>;

export function validateDisableMentalDownEffect(effect: DisableMentalDownEffect): void {
  if (
    !Number.isSafeInteger(effect.duration.value) ||
    (effect.duration.kind === 'sections' && effect.duration.value === 0) ||
    (effect.invocationType !== undefined && !Number.isSafeInteger(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('休憩回避効果の設定が正しくありません。');
}
