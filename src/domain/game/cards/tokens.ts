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
