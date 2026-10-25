export type RecoverMentalSkillEffect = Readonly<{
  kind: 'recover-mental-skill';
  amount: number;
  numberType: number;
  moodBonus?: Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
}>;

export function validateRecoverMentalSkillEffect(effect: RecoverMentalSkillEffect): void {
  if (!Number.isSafeInteger(effect.amount) || !Number.isSafeInteger(effect.numberType))
    throw new Error('元気回復スキルの設定が正しくありません。');
}
