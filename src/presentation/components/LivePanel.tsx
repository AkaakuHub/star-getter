import { Play } from 'lucide-preact';
import type { Card, GameState } from '../../domain/game/model';
import { CardView } from './CardView';
import { Modal } from './Modal';

export type LivePanelKind = 'cards' | 'deck';

export function LivePanel({
  state,
  panel,
  onClose,
  onResume,
  onInspect,
}: Readonly<{
  state: GameState;
  panel: LivePanelKind;
  onClose: () => void;
  onResume: () => void;
  onInspect: (card: Card) => void;
}>) {
  const visible =
    panel === 'cards' ? state.deck.filter((card) => state.hand.includes(card.id)) : state.deck;
  return (
    <Modal title={panel === 'cards' ? '手札' : '編成'} onClose={onClose}>
      <div className="grid grid-cols-3 gap-3">
        {visible.map((card) => (
          <CardView key={card.id} card={card} onClick={() => onInspect(card)} />
        ))}
      </div>
      <button type="button" className="button primary mt-5 w-full" onClick={onResume}>
        <Play size={18} aria-hidden="true" />
        再開
      </button>
    </Modal>
  );
}
