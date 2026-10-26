import type { Effect } from '../model';
import { isInt64 } from '../numeric';

type Detail = Readonly<{ id: bigint; detailType: string; value: bigint }>;
type Input = Readonly<{
  skillEffectId: bigint;
  details: readonly Detail[];
  invocationType?: number;
  deactivationKey?: string;
}>;

const detailTypes = {
  seriesId: 'SWITCH_TOKEN_CARD_DECK_SERIES_ID',
  displayTimeType: 'SWITCH_TOKEN_CARD_DECK_DISPLAY_TIME_TYPE',
  displayTime: 'SWITCH_TOKEN_CARD_DECK_DISPLAY_TIME',
} as const;

export function createSwitchTokenDeckEffect(input: Input): Effect {
  if (!isInt64(input.skillEffectId)) throw new Error('スキル効果IDが正しくありません。');
  const seriesDetails = input.details.filter((item) => item.detailType === detailTypes.seriesId);
  for (const item of seriesDetails) checked(item);
  const displayTimeType = int32(detail(input.details, detailTypes.displayTimeType)?.value ?? 1n);
  const displayTime = detail(input.details, detailTypes.displayTime)?.value ?? 0n;
  const duration =
    displayTimeType === 1
      ? { kind: 'milliseconds' as const, value: Math.fround(Number(displayTime)) }
      : displayTimeType === 2
        ? { kind: 'sections' as const, value: displayTime }
        : displayTimeType === 3
          ? { kind: 'stage' as const, value: 0 }
          : null;
  if (duration === null) throw new Error('トークンカードデッキ切替の期限種別が正しくありません。');
  return {
    kind: 'token-deck-split',
    seriesIds: seriesDetails.length === 0 ? null : seriesDetails.map((item) => item.value),
    duration,
    ...(input.invocationType !== undefined ? { invocationType: input.invocationType } : {}),
    ...(input.deactivationKey !== undefined ? { deactivationKey: input.deactivationKey } : {}),
  };
}

function detail(details: readonly Detail[], type: string): Detail | undefined {
  const item = details.find((value) => value.detailType === type);
  if (item) checked(item);
  return item;
}

function checked(item: Detail): void {
  if (!isInt64(item.id) || !isInt64(item.value)) throw new Error('詳細値が正しくありません。');
}

function int32(value: bigint): number {
  return Number(BigInt.asIntN(32, value));
}
