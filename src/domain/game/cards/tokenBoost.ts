import type { Card, GameState, TokenBoost } from '../model';
import type { TokenRequest } from '../tokenRequestTypes';

function matches(boost: TokenBoost, source: Card | undefined, request: TokenRequest): boolean {
  const target = boost.target;
  const targetMatches =
    target.kind === 'all' ||
    (source !== undefined &&
      (target.kind === 'member'
        ? source.member === target.member
        : target.kind === 'unit'
          ? source.unit === target.unit
          : source.tokenSeriesIds?.includes(target.seriesId) === true));
  return (
    targetMatches &&
    (boost.seriesIds === undefined ||
      (request.seriesIds !== undefined &&
        request.seriesIds.some((id) => boost.seriesIds?.includes(id))))
  );
}

export function boostTokenRequests(
  state: GameState,
  requests: readonly TokenRequest[],
  sourceId: string | null,
  grouped: boolean,
): Readonly<{ state: GameState; counts: readonly number[] }> {
  const source =
    sourceId === null
      ? undefined
      : (state.cardPool.find((card) => card.id === sourceId) ??
        state.specialAppealTokens.find((token) => token.card.id === sourceId)?.card);
  if (sourceId !== null && !source) throw new Error('追加カードを生成するカードがありません。');
  const used = new Set<number>();
  const counts = requests.map((request) => {
    const matching = state.tokenBoosts.flatMap((boost, index) =>
      matches(boost, source, request) ? [{ boost, index }] : [],
    );
    for (const { index } of matching) used.add(index);
    let value = request.count;
    for (const { boost } of matching) {
      if (boost.calculation === 'add') value += Math.fround(boost.value);
    }
    value = Math.fround(value);
    const percent = matching.reduce(
      (sum, { boost }) =>
        boost.calculation === 'multiply-percent'
          ? Math.fround(sum + Math.fround(boost.value))
          : sum,
      0,
    );
    value = Math.fround((Math.max(-100, percent) * value) / 100 + value);
    return Number.isFinite(value)
      ? Math.max(0, grouped ? Math.min(request.count, Math.trunc(value)) : Math.trunc(value))
      : 0;
  });
  return {
    counts,
    state: {
      ...state,
      tokenBoosts: state.tokenBoosts.flatMap((boost, index) => {
        if (!used.has(index) || boost.remainingUses === null) return [boost];
        return boost.remainingUses > 1
          ? [{ ...boost, remainingUses: boost.remainingUses - 1 }]
          : [];
      }),
    },
  };
}
