import {
  setLiveCurrentHandCards,
  liveCurrentHandCardInstanceIds,
} from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import {
  type LiveSkillUseAtBoardState,
  liveBoardState,
  setLiveCardBoardState,
} from '@akaakuhub/suku-sute-core/runtime/cards/deckBoardState';
import {
  createCardDeckBoard,
  currentDeckCardIds,
} from '@akaakuhub/suku-sute-core/game/cards/deckBoard';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';

type Positions = Readonly<Partial<Record<keyof typeof liveBoardState, readonly string[]>>>;

export function withBoardState(
  state: GameState,
  positions: Positions,
  targets: Readonly<Record<string, LiveSkillUseAtBoardState>> = {},
): GameState {
  const metadata = [
    ...new Map(
      [...state.cardPool, ...state.deck].map((card) => [card.cardInstanceId, card]),
    ).values(),
  ];
  const fresh = createCardDeckBoard(metadata, liveCurrentHandCardInstanceIds(state));
  const oldIds = new Set(state.deckBoard.cards.map((card) => card.cardInstanceId));
  let deckBoard: GameState['deckBoard'] = {
    ...state.deckBoard,
    cards: [
      ...state.deckBoard.cards,
      ...fresh.cards.filter((card) => !oldIds.has(card.cardInstanceId)),
    ],
  };
  const active = new Set(currentDeckCardIds(state));
  const metadataIds = new Set(metadata.map((card) => card.cardInstanceId));
  const deckIds = new Set(state.deck.map((card) => card.cardInstanceId));
  deckBoard = {
    ...deckBoard,
    cards: deckBoard.cards
      .filter((card) => metadataIds.has(card.cardInstanceId))
      .map((card) =>
        deckIds.has(card.cardInstanceId) ? card : { ...card, boardState: liveBoardState.exclusion },
      ),
  };
  const fields = ['deck', 'hand', 'graveyard', 'exclusion', 'extra', 'extra2', 'proxy'] as const;
  const cleared = new Set(
    fields.filter((key) => positions[key] !== undefined).map((key) => liveBoardState[key]),
  );
  for (const card of deckBoard.cards) {
    if (
      (active.has(card.cardInstanceId) || card.boardState === liveBoardState.proxy) &&
      cleared.has(card.boardState)
    )
      deckBoard = setLiveCardBoardState(deckBoard, card.cardInstanceId, liveBoardState.extra);
  }
  for (const key of fields) {
    const ids = positions[key];
    if (ids !== undefined)
      for (const id of ids) deckBoard = setLiveCardBoardState(deckBoard, id, liveBoardState[key]);
  }
  const activation = state.activation;
  if (activation) {
    for (const id of activation.usedCards)
      deckBoard = setLiveCardBoardState(
        deckBoard,
        id,
        id === activation.sourceId ? liveBoardState.extra : liveBoardState.extra2,
      );
  }
  deckBoard = {
    ...deckBoard,
    cards: deckBoard.cards.map((card) =>
      Object.hasOwn(targets, card.cardInstanceId)
        ? { ...card, ...targets[card.cardInstanceId] }
        : card,
    ),
  };
  return {
    ...state,
    deckBoard,
    deck: metadata.filter((card) =>
      deckBoard.cards.some(
        (entry) =>
          entry.cardInstanceId === card.cardInstanceId &&
          entry.boardState !== liveBoardState.exclusion,
      ),
    ),
    liveHands: setLiveCurrentHandCards(
      state,
      (positions.hand ?? liveCurrentHandCardInstanceIds(state)).filter(
        (id) => !activation?.usedCards.includes(id),
      ),
    ).liveHands,
  };
}
