import { ResourceGauges } from './ResourceGauges';
import { Gem, Star } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import { type GameState, rules } from '@akaakuhub/suku-sute-core/game/model';
import { durationSeconds } from '@akaakuhub/suku-sute-core/game/projection';
import { formatScore, formatTime } from '../cardDescription';
import { StarScore } from '../score/StarScore';
import { formatNumber } from '../score/formatNumber';
import { liveLayout } from './layout';
import { CardArtwork } from '../mascots/CardArtwork';
import { MoodGraph } from './MoodGraph';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import {
  hasAvailableSpecial,
  specialButtonCard,
  specialCost,
} from '@akaakuhub/suku-sute-core/game/special';

export function LiveHud({
  controller,
  state,
  onSpecial,
  busy,
}: Readonly<{
  controller: GameController;
  state: GameState;
  onSpecial: () => void;
  busy: boolean;
}>) {
  const special = specialButtonCard(state);
  const seconds = state.tick / rules.ticksPerSecond;
  const CollectIcon = state.bloom ? Gem : Star;
  return (
    <>
      <div className="live-header">
        <div className="score-display">
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
      </div>
      {special && (
        <button
          type="button"
          className="special-portrait"
          style={liveLayout.special}
          disabled={busy || state.phase !== 'playing' || !hasAvailableSpecial(state)}
          onClick={onSpecial}
          aria-label="共鳴を選択"
          aria-haspopup="dialog"
        >
          <CardArtwork card={special} />
          <span className="special-cost">
            {state.specialUsed.includes(special.id) ? '使用済み' : '共鳴 ' + specialCost(special)}
          </span>
        </button>
      )}
      <button
        type="button"
        className="collect-number"
        style={liveLayout.hearts}
        disabled={state.phase !== 'playing'}
        onPointerDown={(event) => {
          if (event.button === 0) {
            event.preventDefault();
            controller.collectFromInput();
          }
        }}
        onClick={(event) => {
          if (event.detail === 0) controller.collectFromInput();
        }}
        aria-label={
          controller.waiting
            ? 'カード使用待ちを解除'
            : heartCount(state) +
              '個の' +
              (state.bloom ? '結晶' : 'きらめき') +
              'を回収、上限' +
              state.hearts.heartLimit +
              '個'
        }
      >
        <CollectIcon
          className="heart-count-icon"
          size={18}
          fill={state.bloom ? 'none' : 'currentColor'}
          aria-hidden="true"
        />
        <strong className="heart-count-current">{formatNumber(heartCount(state))}</strong>
        <span aria-hidden="true">/</span>
        <span className="heart-count-limit">{formatNumber(state.hearts.heartLimit)}</span>
      </button>
      <ResourceGauges state={state} />
      <MoodGraph state={state} />
      <div className="live-amplification">
        アクション効果+{(state.amplification - 100).toLocaleString('ja-JP')}%
      </div>
    </>
  );
}
