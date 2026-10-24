import type { GameState, TokenKind } from '../model';

export function addTokens(state: GameState, kind: TokenKind, count: number): GameState {
  const template = state.tokenCatalog.find((card) => card.token === kind);
  if (!template) throw new Error('追加カードの定義がありません。');
  const generated = Array.from({ length: count }, (_, index) => ({
    ...template,
    id: `${template.id}-${state.nextTokenId + index}`,
  }));
  return {
    ...state,
    deck: [...state.deck, ...generated],
    drawPile: [...state.drawPile, ...generated.map((card) => card.id)],
    nextTokenId: state.nextTokenId + count,
  };
}
