import { type GameState, type TokenKind, rules } from '../model';
import { boostTokenRequests } from './tokenBoost';
import { initializeParameterValueFactors } from '../parameters/parameterValueChange';

export function addTokens(state: GameState, kind: TokenKind, count: number): GameState {
  const template = state.tokenCatalog.find((card) => card.token === kind);
  if (!template) throw new Error('追加カードの定義がありません。');
  const generated = Array.from(
    { length: Math.min(count, rules.maxDeckSize - state.deck.length) },
    (_, index) => ({
      ...template,
      id: `${template.id}-${state.nextTokenId + index}`,
    }),
  );
  return initializeParameterValueFactors(
    {
      ...state,
      deck: [...state.deck, ...generated],
      cardPool: [...state.cardPool, ...generated],
      drawPile: [...state.drawPile, ...generated.map((card) => card.id)],
      nextTokenId: state.nextTokenId + generated.length,
    },
    generated,
  );
}

export function beginTokenGeneration(state: GameState, sourceId: string): GameState {
  return { ...state, tokenGroups: [...state.tokenGroups, { sourceId, requests: [] }] };
}

export function requestTokens(
  state: GameState,
  token: TokenKind,
  count: number,
  sourceId: string | null,
  seriesIds?: readonly number[],
): GameState {
  if (count < 1) return state;
  const index = state.tokenGroups.findLastIndex((group) => group.sourceId === sourceId);
  if (index < 0) {
    const boosted = boostTokenRequests(state, [{ token, count, seriesIds }], sourceId, false);
    return addTokens(boosted.state, token, boosted.counts[0] ?? 0);
  }
  if (state.deck.length >= rules.maxDeckSize) return state;
  return {
    ...state,
    tokenGroups: state.tokenGroups.map((group, position) =>
      position === index
        ? { ...group, requests: [...group.requests, { token, count, seriesIds }] }
        : group,
    ),
  };
}

export function finishTokenGeneration(state: GameState, sourceId: string): GameState {
  const group = state.tokenGroups.at(-1);
  if (!group || group.sourceId !== sourceId)
    throw new Error('追加カードの生成順序が正しくありません。');
  const boosted = boostTokenRequests(state, group.requests, sourceId, true);
  let next: GameState = { ...boosted.state, tokenGroups: state.tokenGroups.slice(0, -1) };
  const pending = group.requests.map((request, index) => ({
    token: request.token,
    count: boosted.counts[index] ?? 0,
  }));
  while (next.deck.length < rules.maxDeckSize) {
    let added = false;
    for (const request of pending) {
      if (request.count < 1 || next.deck.length >= rules.maxDeckSize) continue;
      next = addTokens(next, request.token, 1);
      request.count--;
      added = true;
    }
    if (!added) break;
  }
  return next;
}
