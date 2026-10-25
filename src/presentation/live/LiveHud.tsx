import { ResourceGauges } from './ResourceGauges';
import { Gem, Star, Sparkles } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import { type GameState, rules } from '../../domain/game/model';
import { durationSeconds } from '../../domain/game/projection';
import { formatScore, formatTime } from '../cardDescription';
import { StarScore } from '../score/StarScore';
import { liveLayout } from './layout';
import { CardArtwork } from '../mascots/CardArtwork';
import { MoodGraph } from './MoodGraph';
import { heartCount } from '../../domain/game/hearts';

export function LiveHud({
  controller,
  state,
}: Readonly<{ controller: GameController; state: GameState }>) {
  const lead = state.deck[0];
  if (!lead) throw new Error('センターカードがありません。');
  const seconds = state.tick / rules.ticksPerSecond;
  const CollectIcon = state.bloom ? Gem : Star;
  return (
    <>
      <div className="score-display" style={liveLayout.score}>
        <span>STAR</span>
        <StarScore value={state.score} />
      </div>
      <div className="live-track">
        <h1>{state.track.name}</h1>
        <time>
          {formatTime(seconds)} / {formatTime(durationSeconds(state))}
        </time>
      </div>
      {state.combo > 0 && (
        <div className="collection-combo" key={state.lastCollectTick} role="status">
          <strong>{state.combo}</strong> CHAIN
        </div>
      )}
      {state.lastGain > 0n && state.tick - state.lastCollectTick < 45 && (
        <div className="collection-gain" key={'gain-' + state.lastCollectTick}>
          +{formatScore(state.lastGain)}
        </div>
      )}
      <button
        type="button"
        className="special-portrait"
        style={liveLayout.special}
        disabled={state.charge < 100 || state.phase !== 'playing' || state.resting}
        onClick={() => controller.command({ type: 'special' })}
        aria-label={'共鳴、チャージ' + Math.floor(state.charge) + '%'}
      >
        <CardArtwork card={lead} />
        <span className="special-charge">
          <Sparkles size={12} aria-hidden="true" />
          共鳴 {Math.floor(state.charge)}%
        </span>
      </button>
      <button
        type="button"
        className="collect-number"
        style={liveLayout.hearts}
        disabled={!heartCount(state) || state.phase !== 'playing'}
        onPointerDown={(event) => {
          if (event.button === 0) {
            event.preventDefault();
            controller.command({ type: 'collect' });
          }
        }}
        onClick={(event) => {
          if (event.detail === 0) controller.command({ type: 'collect' });
        }}
        aria-label={heartCount(state) + '個の' + (state.bloom ? '結晶' : 'きらめき') + 'を回収'}
      >
        <CollectIcon
          className="heart-count-icon"
          size={18}
          fill={state.bloom ? 'none' : 'currentColor'}
          aria-hidden="true"
        />
        <strong className="heart-count-current">{heartCount(state)}</strong>
        <span className="heart-count-limit">/{state.hearts.heartLimit}</span>
      </button>
      <ResourceGauges state={state} />
      <MoodGraph state={state} />
      <div className="live-amplification">
        アクション効果+{(state.amplification - 100).toLocaleString('ja-JP')}%
      </div>
    </>
  );
}
