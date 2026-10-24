import { Pause, Play, Menu, List } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import type { RouteId } from '../../content/routes';
import type { GameState } from '../../domain/game/model';
import { LiveHud } from '../live/LiveHud';
import { liveLayout } from '../live/layout';
import { Stage } from '../stage/Stage';
import { Hand } from './Hand';
import { CardPreview } from './CardPreview';
import { Result } from './Result';
import { CardUseLayer } from '../cards/CardUseLayer';

export function GameView({
  controller,
  state,
  route,
  onReplay,
  onPause,
  onMenu,
  onHand,
  busy,
}: Readonly<{
  controller: GameController;
  state: GameState;
  route: RouteId;
  onReplay: () => void;
  onPause: () => void;
  onMenu: () => void;
  onHand: () => void;
  busy: boolean;
}>) {
  return (
    <main className={'idol-game' + (state.bloom ? ' is-blooming' : '')} aria-label="ライブ">
      <Stage controller={controller} state={state} />
      <LiveHud controller={controller} state={state} />
      <nav aria-label="ライブ操作">
        <button
          type="button"
          className="live-tool live-list"
          style={liveLayout.cards}
          onClick={onHand}
          disabled={busy}
        >
          <List size={13} aria-hidden="true" />
          手札 {state.hand.length}
        </button>
        <button
          type="button"
          className="live-tool live-pause"
          style={liveLayout.pause}
          aria-label={state.phase === 'paused' ? '再開' : '一時停止'}
          aria-pressed={state.phase === 'paused'}
          onClick={onPause}
        >
          {state.phase === 'paused' ? (
            <Play size={20} aria-hidden="true" />
          ) : (
            <Pause size={20} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="live-tool live-menu-button"
          aria-label="設定"
          onClick={onMenu}
          disabled={busy}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </nav>
      <Hand controller={controller} state={state} />
      <CardUseLayer controller={controller} />
      <CardPreview card={controller.selectedCard} onClose={() => controller.clearSelection()} />
      {state.phase === 'paused' && (
        <div className="pause-band" role="status">
          一時停止
        </div>
      )}
      {state.phase === 'finished' && (
        <Result state={state} route={route} onReplay={onReplay} busy={busy} />
      )}
    </main>
  );
}
