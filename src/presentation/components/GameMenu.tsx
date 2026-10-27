import { routes, routeIds, type RouteId } from '../../content/routes';
import { starGatherHeartShowLimitSettings } from '@akaakuhub/suku-sute-core/game/live/heartPresentation';
import { Modal } from './Modal';

export function GameMenu({
  route,
  heartShowLimit,
  busy,
  onRoute,
  onHeartShowLimit,
  onClose,
}: Readonly<{
  route: RouteId;
  heartShowLimit: number;
  busy: boolean;
  onRoute: (route: RouteId) => void;
  onHeartShowLimit: (value: number) => void;
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
          <label htmlFor="heart-show-limit">きらめき表示数</label>
          <output htmlFor="heart-show-limit">{heartShowLimit}個</output>
        </div>
        <input
          id="heart-show-limit"
          type="range"
          min={starGatherHeartShowLimitSettings.minimum}
          max={starGatherHeartShowLimitSettings.maximum}
          step={starGatherHeartShowLimitSettings.step}
          value={heartShowLimit}
          disabled={busy}
          onInput={(event) => onHeartShowLimit(Number(event.currentTarget.value))}
        />
      </div>
    </Modal>
  );
}
