export type ReshuffleSkillEffect = Readonly<{
  kind: 'reshuffle-skill';
  recoveryType: number;
  stashType: number;
}>;

export function validateReshuffleSkillEffect(effect: ReshuffleSkillEffect): void {
  if (!Number.isSafeInteger(effect.recoveryType) || !Number.isSafeInteger(effect.stashType))
    throw new Error('引き直しスキルの設定が正しくありません。');
}
