import { Zap } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import type { GameState } from '../../domain/game/model';
import { cardAt } from '../../domain/game/projection';
import { describeCard } from '../cardDescription';
import { handLayout } from '../handLayout';

export function Hand({
  controller,
  state,
}: Readonly<{ controller: GameController; state: GameState }>) {
  return (
    <section
      aria-label="手札"
      className="pointer-events-none absolute inset-x-0 bottom-[env(safe-area-inset-bottom)] z-20 h-[32cqw]"
    >
      {state.hand.map((id, index) => {
        const card = cardAt(state, index);
        const use = () => controller.tapCard(index);
        return (
          <button
            type="button"
            key={id}
            className={'hand-card color-' + card.performer}
            style={handLayout(index, state.hand.length)}
            disabled={state.phase !== 'playing' && state.phase !== 'paused'}
            aria-pressed={controller.selectedCard?.id === card.id}
            aria-label={card.name + '、AP' + card.cost + '、' + describeCard(card)}
            onPointerDown={(event) => {
              if (event.button === 0) {
                event.preventDefault();
                use();
              }
            }}
            onClick={(event) => {
              if (event.detail === 0) use();
            }}
          >
            <img src={card.art} alt="" draggable={false} />
            <span className="hand-cost">
              <Zap size={11} aria-hidden="true" />
              {card.cost}
            </span>
            <span className="hand-name">{card.name}</span>
          </button>
        );
      })}
    </section>
  );
}
