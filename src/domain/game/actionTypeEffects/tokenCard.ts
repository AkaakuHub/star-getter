import type { TokenCardEffect } from '../tokenRequestTypes';
import { isInt64 } from '../numeric';

type Detail = Readonly<{
  id: bigint;
  detailType: string;
  value: bigint;
  paramValues?: readonly bigint[];
}>;

type Input = Readonly<{
  skillEffectId: bigint;
  details: readonly Detail[];
}>;

export function createTokenCardEffect(input: Input): TokenCardEffect {
  if (!isInt64(input.skillEffectId)) throw new Error('スキル効果IDが正しくありません。');
  const countDetail = find(input.details, 'TOKEN_CARD_CARD_COUNT');
  const count = countDetail?.value ?? 1n;
  const resourceId = int32(find(input.details, 'TOKEN_CARD_RESOURCE_ID')?.value ?? 0n);
  const seriesDetail = input.details.find((detail) => detail.detailType === 'TOKEN_CARD_SERIES_ID');
  if (seriesDetail && (!isInt64(seriesDetail.id) || !isInt64(seriesDetail.value)))
    throw new Error('詳細値が正しくありません。');
  const seriesIds = seriesDetail?.paramValues?.map((value) => {
    if (!isInt64(value)) throw new Error('詳細値が正しくありません。');
    return value;
  });
  return {
    kind: 'token-card',
    templateId: String(resourceId),
    count,
    ...(seriesIds && seriesIds.length > 0 ? { seriesIds } : {}),
  };
}

function find(details: readonly Detail[], type: string): Detail | undefined {
  const detail = details.find((item) => item.detailType === type);
  if (detail && (!isInt64(detail.id) || !isInt64(detail.value)))
    throw new Error('詳細値が正しくありません。');
  return detail;
}

function int32(value: bigint): number {
  return Number(BigInt.asIntN(32, value));
}
