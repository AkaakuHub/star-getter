import type { GameController } from '../../app/gameController';
import { cardAt } from '../../domain/game/projection';
import { cardCost } from '../../domain/game/cards/cost';
import { HandCardFace } from '../cards/HandCardFace';
import { Modal } from './Modal';

export function HandPanel({
  controller,
  onClose,
  onInspect,
}: Readonly<{ controller: GameController; onClose: () => void; onInspect: () => void }>) {
  const state = controller.state;
  return (
    <Modal title="手札" onClose={onClose}>
      <div className="hand-panel-cards">
        {state.hand.map((id, index) => {
          const card = cardAt(state, index);
          return (
            <button
              key={id}
              type="button"
              className={'hand-panel-card color-' + card.performer}
              onClick={() => {
                controller.tapCard(index);
                onInspect();
              }}
              aria-label={card.name + 'の効果を確認'}
            >
              <HandCardFace card={card} cost={cardCost(state, card)} />
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
