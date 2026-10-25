export type GenesisSkillEffect = Readonly<{
  kind: 'genesis-skill';
  effectBaseNum: number;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
}>;

export function validateGenesisSkill(effect: GenesisSkillEffect): void {
  if (
    !Number.isSafeInteger(effect.effectBaseNum) ||
    !['milliseconds', 'sections', 'stage'].includes(effect.duration.kind) ||
    !Number.isSafeInteger(effect.duration.value)
  )
    throw new Error('ジェネシススキルの設定が正しくありません。');
}
