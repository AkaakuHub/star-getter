import { type GameState, type TokenKind, rules } from '../model';

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
  return {
    ...state,
    deck: [...state.deck, ...generated],
    cardPool: [...state.cardPool, ...generated],
    drawPile: [...state.drawPile, ...generated.map((card) => card.id)],
    nextTokenId: state.nextTokenId + generated.length,
  };
}

export function beginTokenGeneration(state: GameState, sourceId: string): GameState {
  return { ...state, tokenGroups: [...state.tokenGroups, { sourceId, requests: [] }] };
}

export function requestTokens(
  state: GameState,
  token: TokenKind,
  count: number,
  sourceId: string | null,
): GameState {
  if (count < 1 || state.deck.length >= rules.maxDeckSize) return state;
  const index = state.tokenGroups.findLastIndex((group) => group.sourceId === sourceId);
  if (index < 0) return addTokens(state, token, count);
  return {
    ...state,
    tokenGroups: state.tokenGroups.map((group, position) =>
      position === index ? { ...group, requests: [...group.requests, { token, count }] } : group,
    ),
  };
}

export function finishTokenGeneration(state: GameState, sourceId: string): GameState {
  const group = state.tokenGroups.at(-1);
  if (!group || group.sourceId !== sourceId)
    throw new Error('追加カードの生成順序が正しくありません。');
  let next: GameState = { ...state, tokenGroups: state.tokenGroups.slice(0, -1) };
  const pending = group.requests.map((request) => ({ ...request }));
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
