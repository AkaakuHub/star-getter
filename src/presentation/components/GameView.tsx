import { Pause, Play, List, Layers } from 'lucide-preact';
import { useState } from 'preact/hooks';
import type { GameController } from '../../app/gameController';
import type { Card, GameState } from '../../domain/game/model';
import { LiveHud } from '../live/LiveHud';
import { liveLayout } from '../live/layout';
import { Stage } from '../stage/Stage';
import { Hand } from './Hand';
import { CardPreview } from './CardPreview';
import { LivePanel, type LivePanelKind } from './LivePanel';
import { Result } from './Result';

export function GameView({
  controller,
  state,
  bestScore,
  onHome,
  onReplay,
  onPause,
  helpOpen,
  busy,
}: Readonly<{
  controller: GameController;
  state: GameState;
  bestScore: bigint;
  onHome: () => void;
  onReplay: () => void;
  onPause: () => void;
  helpOpen: boolean;
  busy: boolean;
}>) {
  const [panel, setPanel] = useState<LivePanelKind | null>(null);
  const [inspected, setInspected] = useState<Card | null>(null);
  const openPanel = (next: LivePanelKind) => {
    setPanel(next);
    if (state.phase === 'playing') onPause();
  };
  const resume = () => {
    setPanel(null);
    onPause();
  };
  return (
    <main className={'idol-game' + (state.bloom ? ' is-blooming' : '')} aria-label="ライブ">
      <Stage controller={controller} state={state} />
      <LiveHud controller={controller} state={state} />
      <nav aria-label="ライブ操作">
        <button
          type="button"
          className="live-tool live-pause"
          style={liveLayout.pause}
          aria-label={state.phase === 'paused' ? '再開' : '一時停止'}
          aria-pressed={state.phase === 'paused'}
          onClick={resume}
        >
          {state.phase === 'paused' ? (
            <Play size={20} aria-hidden="true" />
          ) : (
            <Pause size={20} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="live-tool live-list"
          style={liveLayout.cards}
          onClick={() => openPanel('cards')}
        >
          <List size={13} aria-hidden="true" />
          手札 {state.hand.length}
        </button>
        <button
          type="button"
          className="live-tool live-list"
          style={liveLayout.deck}
          onClick={() => openPanel('deck')}
        >
          <Layers size={13} aria-hidden="true" />
          編成 {state.deck.length}
        </button>
      </nav>
      <Hand controller={controller} state={state} onSelect={() => setInspected(null)} />
      <CardPreview
        card={inspected ?? controller.selectedCard}
        onClose={() => {
          setInspected(null);
          controller.clearSelection();
        }}
      />
      {state.phase === 'paused' && panel === null && !helpOpen && (
        <div className="pause-band" role="status">
          一時停止
        </div>
      )}
      {state.phase === 'paused' && panel !== null && !helpOpen && (
        <LivePanel
          state={state}
          panel={panel}
          onClose={() => setPanel(null)}
          onResume={resume}
          onInspect={(card) => {
            setInspected(card);
            setPanel(null);
          }}
        />
      )}
      {state.phase === 'finished' && !helpOpen && (
        <Result
          state={state}
          bestScore={bestScore > state.score ? bestScore : state.score}
          onReplay={onReplay}
          onHome={onHome}
          busy={busy}
        />
      )}
    </main>
  );
}
