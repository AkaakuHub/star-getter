import { List, Layers, Play, RotateCcw, LogOut, CircleHelp } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { performers } from '../../content/performers';
import type { GameState } from '../../domain/game/model';
import { describeCard, formatScore } from '../cardDescription';
import { CardView } from './CardView';
import { Modal } from './Modal';

export type LivePanelKind = 'menu' | 'cards' | 'deck';

export function LivePanel({
  state,
  panel,
  onPanel,
  onClose,
  onResume,
  onHome,
  onReplay,
  onHelp,
}: Readonly<{
  state: GameState;
  panel: LivePanelKind;
  onPanel: (panel: LivePanelKind) => void;
  onClose: () => void;
  onResume: () => void;
  onHome: () => void;
  onReplay: () => void;
  onHelp: () => void;
}>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = state.deck.find((card) => card.id === selectedId);
  const visible =
    panel === 'cards' ? state.deck.filter((card) => state.hand.includes(card.id)) : state.deck;
  const title =
    panel === 'menu' ? 'ライブメニュー' : panel === 'cards' ? '手札を確認' : '編成を確認';
  return (
    <Modal title={title} onClose={onClose}>
      {panel === 'menu' ? (
        <div className="grid gap-3">
          <div className="mb-2 rounded-lg border-2 border-[#353148] bg-[#fffaf5] p-4 text-center text-xl font-bold tabular-nums">
            {formatScore(state.score)}
          </div>
          <button type="button" className="button primary" onClick={onResume}>
            <Play size={19} />
            再開
          </button>
          <button type="button" className="button quiet" onClick={() => onPanel('cards')}>
            <List size={18} />
            手札を確認
          </button>
          <button type="button" className="button quiet" onClick={() => onPanel('deck')}>
            <Layers size={18} />
            編成を確認
          </button>
          <button type="button" className="button quiet" onClick={onHelp}>
            <CircleHelp size={18} />
            遊び方
          </button>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button type="button" className="button quiet" onClick={onReplay}>
              <RotateCcw size={16} />
              やり直す
            </button>
            <button type="button" className="button quiet" onClick={onHome}>
              <LogOut size={16} />
              楽曲選択
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {visible.map((card) => (
              <CardView
                key={card.id}
                card={card}
                selected={selectedId === card.id}
                onClick={() => setSelectedId(card.id)}
              />
            ))}
          </div>
          {selected && (
            <div className="mt-5 rounded-lg border-2 border-[#353148] bg-[#fffaf5] p-4">
              <h3 className="font-bold">
                {performers[selected.performer].name} / {selected.name}
              </h3>
              <p className="mt-3 text-sm leading-7">{describeCard(selected)}</p>
              <p className="mt-2 text-sm">アピール {selected.appeal}</p>
            </div>
          )}
          <button type="button" className="button primary mt-5 w-full" onClick={onResume}>
            <Play size={18} />
            再開
          </button>
        </>
      )}
    </Modal>
  );
}
