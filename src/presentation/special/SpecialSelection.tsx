import type { GameState } from '../../domain/game/model';
import {
  canUseSpecial,
  isBloomSpecial,
  specialCards,
  specialCost,
} from '../../domain/game/special';
import { describeSpecial } from '../cards/describeSpecial';
import { Modal } from '../components/Modal';
import { CardArtwork } from '../mascots/CardArtwork';

export function SpecialSelection({
  state,
  busy,
  onUse,
  onClose,
}: Readonly<{
  state: GameState;
  busy: boolean;
  onUse: (cardId: string) => void;
  onClose: () => void;
}>) {
  return (
    <Modal title="共鳴" onClose={onClose} className="special-selection">
      <div className="special-options">
        {specialCards(state).map((card) => {
          const used = state.specialUsed.includes(card.id);
          const action = isBloomSpecial(card)
            ? '開花を発動（エナジー' + specialCost(card) + '）'
            : 'エナジー' + specialCost(card) + 'で使用';
          return (
            <section className="special-option" key={card.id}>
              <div className="special-option-art" aria-hidden="true">
                <CardArtwork card={card} />
              </div>
              <h3>{card.name}</h3>
              <p>{describeSpecial(card)}</p>
              <button
                type="button"
                className="button primary"
                disabled={busy || !canUseSpecial(state, card.id)}
                onClick={() => onUse(card.id)}
                aria-label={card.name + 'の共鳴、' + (used ? '使用済み' : action)}
              >
                {used ? '使用済み' : action}
              </button>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
