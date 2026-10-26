import type { TokenCardEffect } from '../tokenRequestTypes';
import { isInt64 } from '../numeric';

type Input = Readonly<{
  skillEffectId: bigint;
  details: readonly Readonly<{ id: bigint; detailType: string; value: bigint }>[];
  templateId: string;
}>;

export function createTokenCardEffect(input: Input): TokenCardEffect {
  if (!isInt64(input.skillEffectId)) throw new Error('スキル効果IDが正しくありません。');
  if (!input.templateId) throw new Error('追加カードのテンプレートがありません。');
  const countDetail = find(input.details, 'TOKEN_CARD_CARD_COUNT');
  const count = Number(BigInt.asIntN(32, countDetail?.value ?? 1n));
  const seriesIds = input.details
    .filter((detail) => detail.detailType === 'TOKEN_CARD_SERIES_ID')
    .map((detail) => {
      if (!isInt64(detail.id) || !isInt64(detail.value))
        throw new Error('詳細値が正しくありません。');
      return detail.value;
    });
  return {
    kind: 'token-card',
    templateId: input.templateId,
    count,
    ...(seriesIds.length > 0 ? { seriesIds } : {}),
  };
}

function find(details: Input['details'], type: string): Input['details'][number] | undefined {
  const detail = details.find((item) => item.detailType === type);
  if (detail && (!isInt64(detail.id) || !isInt64(detail.value)))
    throw new Error('詳細値が正しくありません。');
  return detail;
}
