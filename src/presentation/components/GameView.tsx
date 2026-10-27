import { Pause, Menu, List, Layers, Star, Volume2, VolumeX } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import type { RouteId } from '../../content/routes';
import { type GameState, rules } from '@akaakuhub/suku-sute-core/game/model';
import { handCapacity } from '@akaakuhub/suku-sute-core/game/cards/drawing';
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
  onWaitMode,
  onAutomaticHearts,
  onMenu,
  onHand,
  onDeck,
  onSpecial,
  muted,
  onMuted,
  busy,
}: Readonly<{
  controller: GameController;
  state: GameState;
  route: RouteId;
  onReplay: () => void;
  onWaitMode: () => void;
  onAutomaticHearts: () => void;
  onMenu: () => void;
  onHand: () => void;
  onDeck: () => void;
  onSpecial: () => void;
  muted: boolean;
  onMuted: () => void;
  busy: boolean;
}>) {
  return (
    <main className={'idol-game' + (state.bloom ? ' is-blooming' : '')} aria-label="ライブ">
      <Stage controller={controller} state={state} />
      <LiveHud controller={controller} state={state} onSpecial={onSpecial} busy={busy} />
      <nav aria-label="ライブ操作">
        <button
          type="button"
          className="live-tool live-list"
          style={liveLayout.cards}
          onClick={onHand}
          disabled={busy}
        >
          <List size={13} aria-hidden="true" />
          <span>
            手札{state.hand.length}/{handCapacity(state)}・全{state.deck.length}/{rules.maxDeckSize}
          </span>
        </button>
        <button
          type="button"
          className="live-tool live-list"
          style={liveLayout.deck}
          onClick={onDeck}
          disabled={busy}
        >
          <Layers size={13} aria-hidden="true" />
          山札{state.drawPile.length}・捨札{state.discard.length}
        </button>
        <button
          type="button"
          className="live-tool live-pause"
          style={liveLayout.pause}
          aria-label="カード使用可能時の自動停止"
          aria-pressed={controller.waitModeEnabled}
          onClick={onWaitMode}
        >
          <Pause size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="live-tool live-auto-heart"
          style={liveLayout.automaticHeart}
          aria-label="きらめき100個で自動回収"
          aria-pressed={state.automaticHeart.enabled}
          onClick={onAutomaticHearts}
          disabled={busy || state.phase === 'finished'}
        >
          <Star size={20} aria-hidden="true" />
          <span>100</span>
        </button>
        <button
          type="button"
          className="live-tool live-sound-button"
          aria-label={muted ? '音声をオンにする' : '音声をオフにする'}
          aria-pressed={!muted}
          onClick={onMuted}
        >
          {muted ? (
            <VolumeX size={20} aria-hidden="true" />
          ) : (
            <Volume2 size={20} aria-hidden="true" />
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
      <CardPreview card={controller.selectedCard} />
      {(state.phase === 'paused' || controller.waiting) && (
        <div className="pause-band" role="status">
          {controller.waiting ? 'カード使用待ち' : '一時停止'}
        </div>
      )}
      {state.phase === 'finished' && (
        <Result state={state} route={route} onReplay={onReplay} busy={busy} />
      )}
    </main>
  );
}
