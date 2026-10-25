import type { Card, GameState } from '../model';

export function advanceHandCollectionAbilities(
  state: GameState,
  count: number,
): Readonly<{ state: GameState; activated: readonly Card[] }> {
  const counts = { ...state.handHeartCollectCounts };
  const activated: Card[] = [];
  for (const id of state.hand) {
    if (state.relayUsed.includes(id)) continue;
    const card = state.deck.find((item) => item.id === id);
    if (!card) throw new Error('手札のカードがありません。');
    const threshold =
      card.relay?.threshold ??
      (card.token === 'story' || card.token === 'bookmark' || card.collectionAbility
        ? 500_000
        : null);
    if (threshold === null) continue;
    const total = (counts[id] ?? 0) + count;
    counts[id] = total < threshold ? total : 0;
    if (total >= threshold) activated.push(card);
  }
  return {
    state: {
      ...state,
      handHeartCollectCounts: counts,
      relayUsed: [...state.relayUsed, ...activated.map((card) => card.id)],
    },
    activated,
  };
}
