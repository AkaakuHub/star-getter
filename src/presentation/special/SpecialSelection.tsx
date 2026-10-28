import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import {
  canUseSpecial,
  isGenesisSpecial,
  specialCards,
  specialCost,
} from '@akaakuhub/suku-sute-core/game/special';
import { EffectDetails } from '../cards/EffectDetails';
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
          const used = state.specialUsed.includes(card.cardInstanceId);
          const action = isGenesisSpecial(card)
            ? '開花を発動（エナジー' + specialCost(card) + '）'
            : 'エナジー' + specialCost(card) + 'で使用';
          return (
            <section className="special-option" key={card.cardInstanceId}>
              <div className="special-option-art" aria-hidden="true">
                <CardArtwork card={card} />
              </div>
              <h3>{card.name}</h3>
              {card.special && <EffectDetails effects={card.special.effects} />}
              <button
                type="button"
                className="button primary"
                disabled={busy || !canUseSpecial(state, card.cardInstanceId)}
                onClick={() => onUse(card.cardInstanceId)}
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
