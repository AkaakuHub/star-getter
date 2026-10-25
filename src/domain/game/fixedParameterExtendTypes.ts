export type FixedParameterExtendEffect = Readonly<{
  kind: 'fixed-parameter-extend';
  target: 'ap' | 'voltage' | 'mental';
  calculation: 'add' | 'multiply' | 'fixed';
  value: number;
  duration:
    | Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>
    | Readonly<{ kind: 'stage' }>;
}>;

export type FixedParameterExtend = Readonly<{
  id: number;
  target: FixedParameterExtendEffect['target'];
  calculation: FixedParameterExtendEffect['calculation'];
  value: number;
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;

export function validateFixedParameterExtendEffect(effect: FixedParameterExtendEffect): void {
  if (
    !Number.isSafeInteger(effect.value) ||
    !['ap', 'voltage', 'mental'].includes(effect.target) ||
    !['add', 'multiply', 'fixed'].includes(effect.calculation) ||
    (effect.duration.kind !== 'stage' &&
      (!Number.isSafeInteger(effect.duration.value) || effect.duration.value < 0))
  )
    throw new Error('固定パラメーター上限変更の設定が正しくありません。');
}
