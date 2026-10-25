export type HandMaxCardEffect = Readonly<{
  kind: 'hand-max-card';
  duration:
    | Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>
    | Readonly<{ kind: 'stage' }>;
  invocationType?: 0x388 | 0x38b;
  deactivationKey?: string;
}>;

export type HandMaxCardEffectState = Readonly<{
  remainingSeconds: number | null;
  remainingSections: number | null;
  deactivationKey: string | null;
}>;

export function validateHandMaxCardEffect(effect: HandMaxCardEffect): void {
  if (
    (effect.duration.kind !== 'stage' &&
      (!Number.isSafeInteger(effect.duration.value) ||
        effect.duration.value < (effect.duration.kind === 'sections' ? 1 : 0))) ||
    (effect.invocationType !== undefined && ![0x388, 0x38b].includes(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('手札最大化の設定が正しくありません。');
}
