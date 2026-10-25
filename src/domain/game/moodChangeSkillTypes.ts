export type MoodChangeSkillEffect = Readonly<{
  kind: 'mood-change-skill';
  calculationType: 1 | 2 | 3 | 4;
  num: number;
  bonusMood?: Readonly<{ target: 0 | 1 | 2 | 3; value: number }>;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  invocationType?: number;
  deactivationKey?: string;
}>;

export function validateMoodChangeSkillEffect(effect: MoodChangeSkillEffect): void {
  if (
    ![1, 2, 3, 4].includes(effect.calculationType) ||
    !Number.isSafeInteger(effect.num) ||
    (effect.bonusMood !== undefined &&
      (!Number.isFinite(effect.bonusMood.value) ||
        ![0, 1, 2, 3].includes(effect.bonusMood.target))) ||
    !['milliseconds', 'sections', 'stage'].includes(effect.duration.kind) ||
    !Number.isSafeInteger(effect.duration.value) ||
    (effect.duration.kind === 'sections' && effect.duration.value === 0) ||
    (effect.invocationType !== undefined && !Number.isSafeInteger(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('空模様変更スキルの設定が正しくありません。');
}
