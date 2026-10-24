import { Pause, Play, Sparkles } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import { moodNames } from '../../content/performers';
import type { GameState } from '../../domain/game/model';
import {
  canUseCard,
  cardAt,
  durationSeconds,
  scoreMultiplier,
  sectionAt,
} from '../../domain/game/projection';
import { formatScore, formatTime } from '../cardDescription';
import { Stage } from '../stage/Stage';
import { CardView } from './CardView';
import { Meter } from './Meter';
import { Modal } from './Modal';
import { Result } from './Result';

export function GameView({
  controller,
  state,
  bestScore,
  threeD,
  onToggle3D,
  onHome,
  onReplay,
  onPause,
  helpOpen,
  busy,
}: Readonly<{
  controller: GameController;
  state: GameState;
  bestScore: number;
  threeD: boolean;
  onToggle3D: () => void;
  onHome: () => void;
  onReplay: () => void;
  onPause: () => void;
  helpOpen: boolean;
  busy: boolean;
}>) {
  const section = sectionAt(state);
  const seconds = state.tick / 60;
  return (
    <main className="game-layout">
      <section className="live-board">
        <div className="live-heading">
          <div>
            <h2>{state.track.name}</h2>
            <span>
              {formatTime(seconds)} / {formatTime(durationSeconds(state))}
            </span>
          </div>
          <div className="live-tools">
            <button
              type="button"
              className="button quiet"
              aria-pressed={threeD}
              onClick={onToggle3D}
            >
              3D表示
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={onPause}
              aria-label="一時停止"
              disabled={state.phase !== 'playing'}
            >
              <Pause aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          className="song-progress"
          role="progressbar"
          aria-label="楽曲の進行"
          aria-valuemin={0}
          aria-valuemax={Math.ceil(durationSeconds(state))}
          aria-valuenow={Math.floor(seconds)}
        >
          <span style={{ width: `${(seconds / durationSeconds(state)) * 100}%` }} />
        </div>
        <Stage controller={controller} state={state} threeD={threeD} />
        <div className="section-strip" aria-label="楽曲の区間">
          {state.track.sections.map((item) => (
            <span
              key={item.startBeat}
              className={item === section ? 'current' : ''}
              style={{ flexGrow: 1 }}
            >
              {item.name}
            </span>
          ))}
        </div>
      </section>
      <aside className="live-meters panel">
        <div className="score-panel">
          <h2>スコア</h2>
          <strong>{formatScore(state.score)}</strong>
          <span className="multiplier">×{scoreMultiplier(state).toFixed(2)}</span>
        </div>
        <Meter name="エネルギー" value={state.energy} max={10} className="energy-meter" />
        <Meter name="スタミナ" value={state.stamina} className="stamina-meter" />
        <Meter name="熱気" value={state.excitement} className="excitement-meter" />
        <div className={`current-mood mood-${section.mood}`}>
          <span className="mood" />
          {moodNames[section.mood]}
        </div>
        <button
          type="button"
          className="special-button"
          disabled={state.charge < 100 || state.phase !== 'playing' || state.resting}
          onClick={() => controller.command({ type: 'special' })}
        >
          <span className="special-fill" style={{ width: `${state.charge}%` }} />
          <span className="special-label">
            <Sparkles size={18} aria-hidden="true" />
            全員スキル<strong>{Math.floor(state.charge)}%</strong>
          </span>
        </button>
      </aside>
      <section className="hand-panel panel" aria-label="手札">
        <div className="panel-heading">
          <h2>手札</h2>
          <span>
            山札 {state.drawPile.length} / 使用済み {state.discard.length}
          </span>
        </div>
        <div className="hand-cards">
          {state.hand.map((id, index) => (
            <CardView
              key={id}
              card={cardAt(state, index)}
              disabled={!canUseCard(state, index)}
              onClick={() => controller.command({ type: 'card', index })}
            />
          ))}
        </div>
      </section>
      {state.phase === 'paused' && !helpOpen && (
        <Modal title="一時停止" onClose={onPause} className="pause-modal">
          <div className="modal-actions">
            <button type="button" className="button quiet" onClick={onHome}>
              楽曲選択へ
            </button>
            <button type="button" className="button primary" onClick={onPause}>
              <Play size={18} aria-hidden="true" />
              再開
            </button>
          </div>
        </Modal>
      )}
      {state.phase === 'finished' && !helpOpen && (
        <Result
          state={state}
          bestScore={Math.max(bestScore, state.score)}
          onReplay={onReplay}
          onHome={onHome}
          busy={busy}
        />
      )}
    </main>
  );
}
