import { Heart } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import { performers } from '../../content/performers';
import type { GameState } from '../../domain/game/model';
import { sectionAt } from '../../domain/game/projection';
import { Portrait } from '../components/Portrait';
import { StageCanvas } from './StageCanvas';

export function Stage({
  controller,
  state,
  threeD,
}: Readonly<{ controller: GameController; state: GameState; threeD: boolean }>) {
  const section = sectionAt(state);
  const collect = () => controller.command({ type: 'collect' });
  return (
    <div className={`stage ${section.climax ? 'stage-climax' : ''}`}>
      <div className="stage-orbit orbit-one" />
      <div className="stage-orbit orbit-two" />
      {threeD ? (
        <StageCanvas controller={controller} />
      ) : (
        <div
          className={`dom-stage ${state.phase === 'playing' ? 'dancing' : ''}`}
          aria-hidden="true"
        >
          {Object.values(performers).map((performer) => (
            <div key={performer.id} className={`dom-performer color-${performer.id}`}>
              <Portrait performer={performer.id} />
            </div>
          ))}
        </div>
      )}
      <div className="section-heading">
        <span className={`mood mood-${section.mood}`} />
        {section.name}
      </div>
      <button
        type="button"
        className="heart-field"
        aria-label={`${state.hearts.length}個のハートを回収`}
        onClick={collect}
        disabled={state.phase !== 'playing' || state.hearts.length === 0}
      >
        {state.hearts.map((heart) => (
          <span
            key={heart.id}
            className="floating-heart"
            aria-hidden="true"
            data-fading={state.tick - heart.bornTick > 480}
            style={{
              left: `${10 + ((heart.id * 37) % 78)}%`,
              top: `${38 + ((heart.id * 23) % 40)}%`,
              animationDelay: `${(heart.id % 7) * -0.2}s`,
            }}
          >
            <Heart size={24} fill="currentColor" aria-hidden="true" />
          </span>
        ))}
      </button>
      {state.lastCardName && state.tick - state.lastActionTick < 75 && (
        <div className="skill-notice" role="status">
          {state.lastCardName}
        </div>
      )}
      {state.resting && (
        <div className="rest-notice" role="status">
          休憩中
        </div>
      )}
      <button
        type="button"
        className="collect-button"
        onClick={collect}
        disabled={state.phase !== 'playing' || state.hearts.length === 0}
      >
        <Heart size={20} aria-hidden="true" />
        回収<span>{state.hearts.length}</span>
      </button>
    </div>
  );
}
