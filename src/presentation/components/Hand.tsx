import type { GameController } from '../../app/gameController';
import type { GameState } from '../../domain/game/model';
import { cardAt } from '../../domain/game/projection';
import { describeCard } from '../cardDescription';
import { handLayout } from '../handLayout';
import { CardArtwork } from '../mascots/CardArtwork';

export function Hand({
  controller,
  state,
  onSelect,
}: Readonly<{ controller: GameController; state: GameState; onSelect: () => void }>) {
  return (
    <section
      aria-label="手札"
      className="pointer-events-none absolute inset-x-0 bottom-[env(safe-area-inset-bottom)] z-20 h-[32cqw]"
    >
      {state.hand.map((id, index) => {
        const card = cardAt(state, index);
        const use = () => {
          onSelect();
          controller.tapCard(index);
        };
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
            <CardArtwork card={card} />
            <span className="hand-cost">{card.cost}</span>
            <span className="hand-name">{card.name}</span>
          </button>
        );
      })}
    </section>
  );
}
