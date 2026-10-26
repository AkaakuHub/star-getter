import type { Effect } from '../modelTypes';
import type { MemberId } from '../model';
import { isInt64 } from '../numeric';

type Detail = Readonly<{ id: bigint; detailType: string; value: bigint }>;
type Input = Readonly<{
  skillEffectId: bigint;
  details: readonly Detail[];
  effects: readonly Effect[];
  invocationType?: number;
  deactivationKey?: string;
}>;

const detailTypes = {
  members: 'COMBO_INDUCE_MEMBER_PARAMS',
  apPower: 'COMBO_INDUCE_AP_POWER',
  displayTimeType: 'COMBO_INDUCE_DISPLAY_TIME_TYPE',
  displayTime: 'COMBO_INDUCE_DISPLAY_TIME',
  repeatAction: 'COMBO_INDUCE_REPEAT_ACTION',
} as const;

export function createComboInduceEffect(input: Input): Effect {
  if (!isInt64(input.skillEffectId)) throw new Error('スキル効果IDが正しくありません。');
  const memberDetails = input.details.filter((item) => item.detailType === detailTypes.members);
  const members = memberDetails.map((item) => memberId(int32(checkedValue(item))));
  const apPower = firstDetail(input.details, detailTypes.apPower)?.value ?? 10_000n;
  const displayTimeType = int32(
    firstDetail(input.details, detailTypes.displayTimeType)?.value ?? 3n,
  );
  const displayTime = int32(firstDetail(input.details, detailTypes.displayTime)?.value ?? 0n);
  const repeatAction = int32(firstDetail(input.details, detailTypes.repeatAction)?.value ?? 0n);
  if (repeatAction !== 0 && repeatAction !== 1 && repeatAction !== 2)
    throw new Error('コンボ誘発の重複時処理が正しくありません。');
  return {
    kind: 'combo-induce',
    members,
    apPower,
    repeatAction,
    duration: duration(displayTimeType, displayTime),
    effects: input.effects,
    ...(input.deactivationKey !== undefined ? { deactivationKey: input.deactivationKey } : {}),
  };
}

function firstDetail(details: readonly Detail[], detailType: string): Detail | undefined {
  const detail = details.find((item) => item.detailType === detailType);
  if (detail) checkedValue(detail);
  return detail;
}

function checkedValue(detail: Detail): bigint {
  if (!isInt64(detail.id) || !isInt64(detail.value)) throw new Error('詳細値が正しくありません。');
  return detail.value;
}

function memberId(value: number): MemberId {
  if (
    value === 0 ||
    value === 1021 ||
    value === 1022 ||
    value === 1030 ||
    value === 1031 ||
    value === 1032 ||
    value === 1033 ||
    value === 1041 ||
    value === 1042 ||
    value === 1053
  )
    return value;
  throw new Error('コンボ誘発の対象メンバーが正しくありません。');
}

function duration(
  type: number,
  value: number,
): Extract<Effect, { kind: 'combo-induce' }>['duration'] {
  if (type === 1) return { kind: 'milliseconds', value };
  if (type === 2) return { kind: 'sections', value };
  if (type === 3) return { kind: 'stage', value };
  throw new Error('コンボ誘発の期限種別が正しくありません。');
}

function int32(value: bigint): number {
  return Number(BigInt.asIntN(32, value));
}
