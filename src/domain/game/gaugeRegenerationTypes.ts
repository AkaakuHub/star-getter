export type GaugeRegeneration = Readonly<{
  gauge: 'mental' | 'voltage';
  calculationType: number;
  sourceCardId: string | null;
  amount: number;
  intervalType: 1 | 2;
  intervalSeconds: number;
  elapsedSeconds: number;
  durationSeconds: number | null;
  durationElapsedSeconds: number;
  remainingSections: number | null;
  remainingHeartEvents: number | null;
  deactivationKey: string | null;
}>;

export type GaugeRegenerationEffect = Readonly<{
  kind: 'gauge-regeneration';
  gauge: GaugeRegeneration['gauge'];
  calculationType: number;
  amount: number;
  intervalType: 1 | 2;
  intervalMilliseconds: number;
  duration: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
  invocationType?: number;
  deactivationKey?: string;
}>;

export function validateGaugeRegenerationEffect(effect: GaugeRegenerationEffect): void {
  if (
    !Number.isSafeInteger(effect.calculationType) ||
    !Number.isFinite(effect.amount) ||
    !Number.isSafeInteger(effect.intervalMilliseconds) ||
    !Number.isSafeInteger(effect.duration.value) ||
    (effect.duration.kind === 'sections' && effect.duration.value === 0) ||
    (effect.invocationType !== undefined && !Number.isSafeInteger(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('ゲージ継続回復の設定が正しくありません。');
}
