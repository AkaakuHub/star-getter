import { Share2 } from 'lucide-preact';
import type { RouteId } from '../../content/routes';
import type { GameState } from '../../domain/game/model';
import { useResultShare } from './useResultShare';

export function ResultShareButton({
  state,
  route,
  busy,
}: Readonly<{ state: GameState; route: RouteId; busy: boolean }>) {
  const { preparing, ready, sharing, error, share } = useResultShare(state, route);
  return (
    <>
      <button
        type="button"
        className="button primary"
        disabled={busy || !ready || sharing}
        aria-busy={preparing || sharing}
        onClick={() => void share()}
      >
        <Share2 size={18} aria-hidden="true" />
        {preparing ? '結果画像を作成中' : sharing ? '共有中' : '結果画像を共有'}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
