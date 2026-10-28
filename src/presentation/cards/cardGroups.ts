import { boardCardIds } from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import {
  liveBoardState,
  liveDeckBoardCardInstanceIds,
} from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';

export function cardGroups(state: GameState) {
  return [
    { board: 'hand', title: '手札確認', ids: state.hand },
    { board: 'discard', title: '捨札確認', ids: boardCardIds(state, liveBoardState.graveyard) },
    { board: 'deck', title: '山札確認', ids: boardCardIds(state, liveBoardState.deck) },
    {
      board: 'excluded',
      title: '除外',
      ids: liveDeckBoardCardInstanceIds(state.deckBoard, liveBoardState.exclusion),
    },
  ].map(({ board, title, ids }) => {
    const members = new Set(ids);
    return {
      board,
      title,
      cards: state.cardPool.filter((card) => members.has(card.cardInstanceId)),
    };
  });
}
