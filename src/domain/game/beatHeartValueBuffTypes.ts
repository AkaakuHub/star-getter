export type BeatHeartValueBuffEffect = Readonly<{
  kind: 'beat-heart-value-buff';
  calculation: 'add' | 'multiply' | 'fixed';
  amount: number;
  addValue?: number;
  multiplier?: number;
  moodBonus?: Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
  duration?: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  invocationType?: number;
  deactivationKey?: string;
}>;

export function validateBeatHeartValueBuff(effect: BeatHeartValueBuffEffect): void {
  if (
    !['add', 'multiply', 'fixed'].includes(effect.calculation) ||
    !Number.isFinite(effect.amount) ||
    (effect.addValue !== undefined && !Number.isFinite(effect.addValue)) ||
    (effect.multiplier !== undefined && !Number.isFinite(effect.multiplier)) ||
    (effect.moodBonus !== undefined && !Number.isFinite(effect.moodBonus.perPoint)) ||
    (effect.duration !== undefined &&
      (!['milliseconds', 'sections', 'stage'].includes(effect.duration.kind) ||
        !Number.isSafeInteger(effect.duration.value) ||
        effect.duration.value < (effect.duration.kind === 'sections' ? 1 : 0))) ||
    (effect.invocationType !== undefined && !Number.isSafeInteger(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('ビートハート値変更の設定が正しくありません。');
}
