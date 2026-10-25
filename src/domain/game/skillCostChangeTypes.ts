export type SkillCostConditionType =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

export type DeckSkillCostChangeEffect = Readonly<{
  kind: 'deck-skill-cost-change';
  num: number;
  targetRange: 1 | 2 | 3;
  target: 'all' | 'member' | 'main-effect' | 'unit' | 'token-series';
  targetId: number;
}>;

export function validateDeckSkillCostChange(effect: DeckSkillCostChangeEffect): undefined {
  if (
    !Number.isSafeInteger(effect.num) ||
    ![1, 2, 3].includes(effect.targetRange) ||
    !['all', 'member', 'main-effect', 'unit', 'token-series'].includes(effect.target) ||
    !Number.isSafeInteger(effect.targetId)
  )
    throw new Error('デッキカードのスキルコスト変更設定が正しくありません。');
  return undefined;
}

export type SkillCostChangeEffect = Readonly<{
  kind: 'skill-cost-change';
  amount: number;
  minimum: number;
  maximum: number;
  conditionType: SkillCostConditionType;
  conditionId?: number;
  addValue?: number;
  duration?: Readonly<{ sections: number }>;
}>;
