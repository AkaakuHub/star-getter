import { RotateCcw, Share2 } from 'lucide-preact';
import { routes, type RouteId } from '../../content/routes';
import { type GameState } from '../../domain/game/model';
import { formatScore } from '../cardDescription';
import { shareScoreUrl } from '../results/shareScore';

export function Result({
  state,
  route,
  onReplay,
  busy,
}: Readonly<{ state: GameState; route: RouteId; onReplay: () => void; busy: boolean }>) {
  return (
    <section className="result-panel" aria-label="ライブ結果">
      <h2>{routes[route].name}</h2>
      <p className="result-score">{formatScore(state.score)}</p>
      <dl className="result-stats">
        <div>
          <dt>カード使用</dt>
          <dd>{state.stats.cardsUsed}</dd>
        </div>
        <div>
          <dt>最大連続回収</dt>
          <dd>{state.stats.bestCombo}</dd>
        </div>
      </dl>
      <div className="result-actions">
        <a
          className="button primary"
          href={shareScoreUrl(state.score, routes[route].name, location.href)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Share2 size={18} aria-hidden="true" />
          Xでスコアを共有
        </a>
        <button type="button" className="button quiet" onClick={onReplay} disabled={busy}>
          <RotateCcw size={18} aria-hidden="true" />
          もう一度
        </button>
      </div>
    </section>
  );
}
