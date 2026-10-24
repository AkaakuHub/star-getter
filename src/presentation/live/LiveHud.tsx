import { Flower2, Heart, Sparkles, Zap } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import { type GameState, rules } from '../../domain/game/model';
import { durationSeconds, sectionAt } from '../../domain/game/projection';
import { formatFactor, formatScore, formatTime } from '../cardDescription';
import { FittedText } from '../text/FittedText';
import { liveLayout } from './layout';
import { CardArtwork } from '../mascots/CardArtwork';
import { heartCount } from '../../domain/game/hearts';

export function LiveHud({
  controller,
  state,
}: Readonly<{ controller: GameController; state: GameState }>) {
  const lead = state.deck[0];
  if (!lead) throw new Error('センターカードがありません。');
  const section = sectionAt(state);
  const seconds = state.tick / rules.ticksPerSecond;
  const voltage = Math.floor(state.excitement / 2);
  const CollectIcon = state.bloom ? Flower2 : Heart;
  return (
    <>
      <div className="score-display" style={liveLayout.score}>
        <span>LOVE</span>
        <div className="score-value" aria-label={state.score.toString()}>
          <FittedText text={formatScore(state.score)} />
        </div>
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
        aria-label={'スペシャルアピール、チャージ' + Math.floor(state.charge) + '%'}
      >
        <CardArtwork card={lead} />
        <span className="special-charge">
          <Sparkles size={12} aria-hidden="true" />
          SP {Math.floor(state.charge)}%
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
        aria-label={heartCount(state) + '個の' + (state.bloom ? 'フラワー' : 'ハート') + 'を回収'}
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
      <div
        className="voltage-gauge"
        style={liveLayout.voltage}
        role="progressbar"
        aria-label="ボルテージ"
        aria-valuemin={0}
        aria-valuemax={50}
        aria-valuenow={voltage}
      >
        <span>VOLTAGE</span>
        <strong>{voltage}</strong>
        <div>
          <i style={{ width: state.excitement + '%' }} />
        </div>
      </div>
      <div
        className="resource-gauge mental-gauge"
        style={liveLayout.mental}
        role="progressbar"
        aria-label="メンタル"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.floor(state.stamina)}
      >
        <Heart size={15} aria-hidden="true" />
        <div className="vertical-meter">
          <i style={{ height: state.stamina + '%' }} />
        </div>
        <strong>{Math.floor(state.stamina)}</strong>
      </div>
      <div
        className="resource-gauge ap-gauge"
        style={liveLayout.ap}
        role="progressbar"
        aria-label="AP"
        aria-valuemin={0}
        aria-valuemax={rules.maxEnergy}
        aria-valuenow={Math.floor(state.energy)}
      >
        <Zap size={15} aria-hidden="true" />
        <div className="vertical-meter">
          <i style={{ height: state.energy * 10 + '%' }} />
        </div>
        <strong>{state.bloom ? '∞' : Math.floor(state.energy)}</strong>
        <span>AP</span>
      </div>
      <div className="live-analyzer" style={liveLayout.analyzer}>
        <div className="section-timeline">
          {state.track.sections.map((item, index) => (
            <div
              key={item.startBeat}
              className={'mood-' + item.mood + (item === section ? ' is-current' : '')}
            >
              <span>{index + 1}</span>
              <i />
            </div>
          ))}
        </div>
        <div
          className="music-progress"
          role="progressbar"
          aria-label="楽曲の進行"
          aria-valuemin={0}
          aria-valuemax={Math.ceil(durationSeconds(state))}
          aria-valuenow={Math.floor(seconds)}
        >
          <i style={{ width: (seconds / durationSeconds(state)) * 100 + '%' }} />
        </div>
      </div>
      {state.bloom && (
        <div className="bloom-progress" style={liveLayout.bloom}>
          <Flower2 size={13} aria-hidden="true" />
          <span>開花</span>
          <strong>{formatScore(state.bloom.progress)}</strong>
        </div>
      )}
      <div className="live-amplification">効果増幅×{formatFactor(state.amplification)}</div>
    </>
  );
}
