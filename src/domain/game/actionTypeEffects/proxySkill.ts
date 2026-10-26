import type { ProxySkillEffect } from '../proxySkillTypes';
import type { Effect } from '../model';
import { int64ToFloat32, isInt64 } from '../numeric';

type Detail = Readonly<{ id: bigint; detailType: string; value: bigint }>;
type Input = Readonly<{
  skillEffectId: bigint;
  details: readonly Detail[];
  absorbActionTypes: readonly bigint[] | null;
  absorbAmounts: readonly bigint[] | null;
  effects: readonly Readonly<{ actionType: number; effect: Effect }>[];
}>;

const detailTypes = {
  absorbLimit: 'PROXY_SKILL_ABSORB_LIMIT',
  periodType: 'PROXY_SKILL_ABSORB_PERIOD_TYPE',
  periodParam: 'PROXY_SKILL_ABSORB_PERIOD_PARAM',
  induceTiming: 'PROXY_SKILL_INDUCE_TIMING',
  induceCondition: 'PROXY_SKILL_INDUCE_CONDITION',
  inducePowerType: 'PROXY_SKILL_INDUCE_POWER_TYPE',
  inducePowerParam: 'PROXY_SKILL_INDUCE_POWER_PARAM',
} as const;

export function createProxySkillEffect(input: Input): Effect {
  if (!isInt64(input.skillEffectId)) throw new Error('スキル効果IDが正しくありません。');
  if (
    input.absorbActionTypes === null ||
    input.absorbAmounts === null ||
    input.absorbActionTypes.length !== input.absorbAmounts.length
  )
    throw new Error('Proxyスキルの吸収対象が正しくありません。');
  const targets = input.absorbActionTypes.map((actionType, index) => {
    const amount = input.absorbAmounts?.[index];
    if (!isInt64(actionType) || amount === undefined || !isInt64(amount))
      throw new Error('Proxyスキルの吸収対象が正しくありません。');
    return {
      actionType: int32(actionType),
      targetAmount: int32(amount),
    };
  });
  const periodType = int32(value(input.details, detailTypes.periodType, 1n));
  const induceTiming = int32(value(input.details, detailTypes.induceTiming, 1n));
  const induceCondition = int32(value(input.details, detailTypes.induceCondition, 1n));
  const inducePowerType = int32(value(input.details, detailTypes.inducePowerType, 1n));
  if (![1, 2, 3, 4, 5].includes(periodType))
    throw new Error('Proxyスキルの期間種別が正しくありません。');
  if (![1, 2, 3].includes(induceTiming))
    throw new Error('Proxyスキルの誘発タイミングが正しくありません。');
  if (![1, 2].includes(induceCondition))
    throw new Error('Proxyスキルの誘発条件が正しくありません。');
  if (![1, 2, 3].includes(inducePowerType))
    throw new Error('Proxyスキルの威力種別が正しくありません。');
  const effect: ProxySkillEffect = {
    kind: 'proxy-skill',
    absorbLimit: int32(value(input.details, detailTypes.absorbLimit, 1n)),
    periodType: periodType as ProxySkillEffect['periodType'],
    periodParam: value(input.details, detailTypes.periodParam, 0n),
    induceTiming: induceTiming as ProxySkillEffect['induceTiming'],
    induceCondition: induceCondition as ProxySkillEffect['induceCondition'],
    inducePowerType: inducePowerType as ProxySkillEffect['inducePowerType'],
    inducePowerParam: int64ToFloat32(value(input.details, detailTypes.inducePowerParam, 0n)),
    targets,
    effects: input.effects,
  };
  return effect;
}

function value(details: readonly Detail[], type: string, fallback: bigint): bigint {
  const detail = details.find((item) => item.detailType === type);
  if (detail && (!isInt64(detail.id) || !isInt64(detail.value)))
    throw new Error('詳細値が正しくありません。');
  return detail?.value ?? fallback;
}

function int32(value: bigint): number {
  return Number(BigInt.asIntN(32, value));
}
