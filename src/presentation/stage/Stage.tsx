import type { GameController } from '../../app/gameController';
import { performers } from '../../content/performers';
import type { GameState } from '../../domain/game/model';
import { Portrait } from '../components/Portrait';
import { heartCount } from '../../domain/game/hearts';
import { HeartCanvas } from '../hearts/HeartCanvas';

export function Stage({
  controller,
  state,
}: Readonly<{ controller: GameController; state: GameState }>) {
  const collect = () => controller.command({ type: 'collect' });
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="concert-backdrop" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div
        className={'board-performers ' + (controller.running ? 'dancing' : '')}
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
        aria-label={heartCount(state) + '個のきらめきを回収'}
        disabled={state.phase !== 'playing' || heartCount(state) === 0}
        onPointerDown={(event) => {
          if (event.button === 0) {
            event.preventDefault();
            collect();
          }
        }}
        onClick={(event) => {
          if (event.detail === 0) collect();
        }}
      />
      <HeartCanvas controller={controller} />
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
