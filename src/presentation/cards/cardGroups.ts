import type { GameState } from '../../domain/game/model';

export function cardGroups(state: GameState) {
  return [
    { board: 'hand', title: '手札確認', ids: state.hand },
    { board: 'discard', title: '捨札確認', ids: state.discard },
    { board: 'deck', title: '山札確認', ids: state.drawPile },
  ].map(({ board, title, ids }) => ({
    board,
    title,
    cards: ids.map((id) => {
      const card = state.deck.find((item) => item.id === id);
      if (!card) throw new Error('確認するカードがありません。');
      return card;
    }),
  }));
}
