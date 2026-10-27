import type { GameState } from '@akaakuhub/suku-sute-core/game/model';

export function cardGroups(state: GameState) {
  const active = new Set(state.deck.map((card) => card.id));
  return [
    { board: 'hand', title: '手札確認', ids: state.hand },
    { board: 'discard', title: '捨札確認', ids: state.discard },
    { board: 'deck', title: '山札確認', ids: state.drawPile },
    {
      board: 'excluded',
      title: '除外',
      ids: state.cardPool.filter((card) => !active.has(card.id)).map((card) => card.id),
    },
  ].map(({ board, title, ids }) => {
    const members = new Set(ids);
    return { board, title, cards: state.cardPool.filter((card) => members.has(card.id)) };
  });
}
