import { ArrowLeft, RotateCcw, Trophy } from 'lucide-preact';
import { type GameState, rules } from '../../domain/game/model';
import { scoreGrade } from '../../domain/game/projection';
import { formatScore } from '../cardDescription';
import { Modal } from './Modal';

export function Result({
  state,
  bestScore,
  onReplay,
  onHome,
  busy,
}: Readonly<{
  state: GameState;
  bestScore: bigint;
  onReplay: () => void;
  onHome: () => void;
  busy: boolean;
}>) {
  return (
    <Modal title="ライブ結果" className="result-modal">
      <h3>{state.track.name}</h3>
      <div className={`result-grade grade-${scoreGrade(state)}`}>{scoreGrade(state)}</div>
      <p className="result-score">{formatScore(state.score)}</p>
      <p className="result-best">
        <Trophy size={18} aria-hidden="true" />
        最高得点 {formatScore(bestScore)}
      </p>
      <dl className="result-stats">
        <div>
          <dt>目標LOVE</dt>
          <dd>{formatScore(rules.maxScore)}</dd>
        </div>
        <div>
          <dt>回収ハート</dt>
          <dd>{state.stats.heartsCollected}</dd>
        </div>
        <div>
          <dt>時間切れ・上限超過</dt>
          <dd>{state.stats.heartsMissed}</dd>
        </div>
        <div>
          <dt>最大連続回収</dt>
          <dd>{state.stats.bestCombo}</dd>
        </div>
        <div>
          <dt>カード使用</dt>
          <dd>{state.stats.cardsUsed}</dd>
        </div>
        <div>
          <dt>全員スキル</dt>
          <dd>{state.stats.specialsUsed}</dd>
        </div>
      </dl>
      <div className="modal-actions">
        <button type="button" className="button quiet" disabled={busy} onClick={onHome}>
          <ArrowLeft size={18} aria-hidden="true" />
          楽曲選択
        </button>
        <button type="button" className="button primary" disabled={busy} onClick={onReplay}>
          <RotateCcw size={18} aria-hidden="true" />
          もう一度
        </button>
      </div>
    </Modal>
  );
}
