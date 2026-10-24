import { Heart } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import { performers } from '../../content/performers';
import type { GameState } from '../../domain/game/model';
import { Portrait } from '../components/Portrait';

export function Stage({
  controller,
  state,
}: Readonly<{ controller: GameController; state: GameState }>) {
  const collect = () => controller.command({ type: 'collect' });
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src="/stage/concert.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-linear-to-b from-[#160d36]/75 via-transparent to-[#1c0d36]/90" />
      <div
        className={'board-performers ' + (state.phase === 'playing' ? 'dancing' : '')}
        aria-hidden="true"
      >
        {Object.values(performers).map((performer) => (
          <div key={performer.id} className={'board-performer color-' + performer.id}>
            <Portrait performer={performer.id} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="heart-field"
        aria-label={state.hearts.length + '個のハートを回収'}
        disabled={state.phase !== 'playing' || state.hearts.length === 0}
        onPointerDown={(event) => {
          if (event.button === 0) {
            event.preventDefault();
            collect();
          }
        }}
        onClick={(event) => {
          if (event.detail === 0) collect();
        }}
      >
        {state.hearts.slice(0, 24).map((heart) => (
          <span
            key={heart.id}
            className="floating-heart"
            aria-hidden="true"
            style={{
              left: 16 + ((heart.id * 37) % 70) + '%',
              top: 22 + ((heart.id * 23) % 48) + '%',
              animationDelay: (heart.id % 7) * -0.2 + 's',
            }}
          >
            <Heart fill="currentColor" size={23} />
          </span>
        ))}
      </button>
      {state.lastCardName && state.tick - state.lastActionTick < 60 && (
        <div className="skill-notice" role="status">
          {state.lastCardName}
        </div>
      )}
      {state.resting && (
        <div className="rest-notice" role="status">
          休憩中
        </div>
      )}
    </div>
  );
}
