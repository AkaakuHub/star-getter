import { RotateCcw } from 'lucide-preact';
import { routes, type RouteId } from '../../content/routes';
import { type GameState } from '../../domain/game/model';
import { ResultGraph } from '../results/ResultGraph';
import { ResultShareButton } from '../results/ResultShareButton';

export function Result({
  state,
  route,
  onReplay,
  busy,
}: Readonly<{ state: GameState; route: RouteId; onReplay: () => void; busy: boolean }>) {
  const scoreGroups = state.score.toLocaleString('ja-JP').split(',');
  return (
    <section className="result-panel" aria-label="ライブ結果">
      <h2>{routes[route].name}</h2>
      <p className="result-score">
        {scoreGroups.map((group, index) => (
          <span key={index}>
            {group}
            {index < scoreGroups.length - 1 ? ',' : ''}
            <wbr />
          </span>
        ))}
      </p>
      <ResultGraph state={state} />
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
        <ResultShareButton state={state} route={route} busy={busy} />
        <button type="button" className="button quiet" onClick={onReplay} disabled={busy}>
          <RotateCcw size={18} aria-hidden="true" />
          もう一度
        </button>
      </div>
    </section>
  );
}
