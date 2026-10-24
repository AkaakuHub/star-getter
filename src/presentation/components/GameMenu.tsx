import { Volume2, VolumeX } from 'lucide-preact';
import { routes, routeIds, type RouteId } from '../../content/routes';
import { loveGatherHeartShowLimitSettings } from '../../domain/game/live/heartPresentation';
import { Modal } from './Modal';

export function GameMenu({
  route,
  heartShowLimit,
  muted,
  busy,
  onRoute,
  onHeartShowLimit,
  onMuted,
  onClose,
}: Readonly<{
  route: RouteId;
  heartShowLimit: number;
  muted: boolean;
  busy: boolean;
  onRoute: (route: RouteId) => void;
  onHeartShowLimit: (value: number) => void;
  onMuted: () => void;
  onClose: () => void;
}>) {
  return (
    <Modal title="設定" onClose={onClose} className="game-menu">
      <fieldset>
        <legend>プリセット</legend>
        <div className="preset-options">
          {routeIds.map((id) => (
            <button
              key={id}
              type="button"
              className="button quiet"
              aria-pressed={route === id}
              disabled={busy}
              onClick={() => onRoute(id)}
            >
              {routes[id].name}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="heart-display-panel">
        <div className="panel-heading">
          <label htmlFor="heart-show-limit">ハート表示数</label>
          <output htmlFor="heart-show-limit">{heartShowLimit}個</output>
        </div>
        <input
          id="heart-show-limit"
          type="range"
          min={loveGatherHeartShowLimitSettings.minimum}
          max={loveGatherHeartShowLimitSettings.maximum}
          step={loveGatherHeartShowLimitSettings.step}
          value={heartShowLimit}
          disabled={busy}
          onInput={(event) => onHeartShowLimit(Number(event.currentTarget.value))}
        />
      </div>
      <button
        type="button"
        className="button quiet"
        aria-label={muted ? '音声をオンにする' : '音声をオフにする'}
        aria-pressed={!muted}
        onClick={onMuted}
      >
        {muted ? (
          <VolumeX size={22} aria-hidden="true" />
        ) : (
          <Volume2 size={22} aria-hidden="true" />
        )}
      </button>
    </Modal>
  );
}
