import { Pause, List, Layers, Heart, Sparkles, Zap } from 'lucide-preact';
import { useState } from 'preact/hooks';
import type { GameController } from '../../app/gameController';
import { performers, moodNames } from '../../content/performers';
import type { GameState } from '../../domain/game/model';
import { durationSeconds, scoreMultiplier, sectionAt } from '../../domain/game/projection';
import { formatScore, formatTime } from '../cardDescription';
import { Stage } from '../stage/Stage';
import { Hand } from './Hand';
import { LivePanel, type LivePanelKind } from './LivePanel';
import { Result } from './Result';

export function GameView({
  controller,
  state,
  bestScore,
  onHome,
  onReplay,
  onPause,
  onHelp,
  helpOpen,
  busy,
}: Readonly<{
  controller: GameController;
  state: GameState;
  bestScore: number;
  onHome: () => void;
  onReplay: () => void;
  onPause: () => void;
  onHelp: () => void;
  helpOpen: boolean;
  busy: boolean;
}>) {
  const [panel, setPanel] = useState<LivePanelKind>('menu');
  const section = sectionAt(state);
  const seconds = state.tick / 60;
  const lead = state.deck[0];
  if (!lead) throw new Error('センターカードがありません。');
  const openPanel = (next: LivePanelKind) => {
    setPanel(next);
    if (state.phase === 'playing') onPause();
  };
  const special = () => controller.command({ type: 'special' });
  const collect = () => controller.command({ type: 'collect' });
  return (
    <main className="idol-game" aria-label="ライブ">
      <Stage controller={controller} state={state} />
      <div className="pointer-events-none absolute inset-x-[5%] top-[max(12px,env(safe-area-inset-top))] z-10 text-center">
        <div className="score-display">
          <span className="text-[2.5cqw] font-bold tracking-[0.25em] text-pink-100">LOVE</span>
          <strong className="block text-[7.2cqw] leading-tight font-black tabular-nums">
            {formatScore(state.score)}
          </strong>
          <span className="mt-1 block text-[2.8cqw] text-pink-100">
            ×{scoreMultiplier(state).toFixed(2)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between px-1 text-[3cqw] font-bold text-white drop-shadow">
          <h1>{state.track.name}</h1>
          <span className="tabular-nums">
            {formatTime(seconds)} / {formatTime(durationSeconds(state))}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40"
          role="progressbar"
          aria-label="楽曲の進行"
          aria-valuemin={0}
          aria-valuemax={Math.ceil(durationSeconds(state))}
          aria-valuenow={Math.floor(seconds)}
        >
          <span
            className="block h-full rounded-full bg-linear-to-r from-pink-400 to-amber-200"
            style={{ width: (seconds / durationSeconds(state)) * 100 + '%' }}
          />
        </div>
        <div className="mt-2 flex gap-1">
          {state.track.sections.map((item) => (
            <span
              key={item.startBeat}
              className={
                'h-1.5 flex-1 rounded-full ' +
                (item === section ? 'bg-white shadow-[0_0_10px_#fff]' : 'bg-white/25')
              }
            />
          ))}
        </div>
        <div className="mt-2 text-[3cqw] font-bold tracking-widest text-white drop-shadow">
          {section.name}
        </div>
      </div>
      <nav
        aria-label="ライブ操作"
        className="absolute top-[48%] left-[3%] z-30 flex -translate-y-1/2 flex-col gap-3"
      >
        <button
          type="button"
          className="live-tool"
          aria-label="一時停止"
          onClick={() => openPanel('menu')}
        >
          <Pause size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="live-tool"
          aria-label="手札を確認"
          onClick={() => openPanel('cards')}
        >
          <List size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="live-tool"
          aria-label="編成を確認"
          onClick={() => openPanel('deck')}
        >
          <Layers size={20} aria-hidden="true" />
        </button>
      </nav>
      <div className="pointer-events-none absolute top-[25%] right-[5%] z-10 rounded-full border border-amber-200/70 bg-black/30 px-3 py-1 text-[3cqw] font-bold text-amber-100">
        VOLTAGE Lv.{Math.floor(state.excitement / 20)}
      </div>
      <button
        type="button"
        className="special-portrait"
        disabled={state.charge < 100 || state.phase !== 'playing' || state.resting}
        onClick={special}
        aria-label={'スペシャルアピール、チャージ' + Math.floor(state.charge) + '%'}
      >
        <img src={lead.art} alt={performers[lead.performer].name} draggable={false} />
        <span className="absolute inset-x-0 bottom-0 bg-linear-to-r from-amber-400 to-amber-100 py-1 text-[3cqw] font-black text-[#6f2859]">
          <Sparkles size={13} className="mr-1 inline" aria-hidden="true" />
          SP {Math.floor(state.charge)}%
        </span>
      </button>
      <div className="pointer-events-none absolute inset-x-[7%] bottom-[52cqw] z-10">
        <div className="mb-2 flex items-center justify-between text-[2.8cqw] font-bold text-white">
          <span>{moodNames[section.mood]}</span>
          <span>MENTAL {Math.floor(state.stamina)}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full border border-white/40 bg-black/35"
          role="progressbar"
          aria-label="メンタル"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(state.stamina)}
        >
          <span
            className="block h-full bg-linear-to-r from-cyan-300 to-emerald-200"
            style={{ width: state.stamina + '%' }}
          />
        </div>
      </div>
      <button
        type="button"
        className="collect-number"
        disabled={!state.hearts.length || state.phase !== 'playing'}
        onClick={collect}
      >
        <Heart size={17} fill="currentColor" aria-hidden="true" />
        {formatScore(state.hearts.length)}
      </button>
      <div
        className="ap-wheel"
        role="progressbar"
        aria-label="AP"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={Math.floor(state.energy)}
        style={{ background: 'conic-gradient(#ff83ba ' + state.energy * 36 + 'deg, #ffffff24 0)' }}
      >
        <div>
          <Zap size={15} fill="currentColor" aria-hidden="true" />
          <strong>{Math.floor(state.energy)}</strong>
          <span>AP</span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[25cqw] z-10 flex justify-center gap-8 text-[2.7cqw] text-white/80">
        <span>山札 {state.drawPile.length}</span>
        <span>使用済み {state.discard.length}</span>
      </div>
      <Hand controller={controller} state={state} />
      {state.phase === 'paused' && !helpOpen && (
        <LivePanel
          state={state}
          panel={panel}
          onPanel={setPanel}
          onResume={onPause}
          onHome={onHome}
          onReplay={onReplay}
          onHelp={onHelp}
        />
      )}
      {state.phase === 'finished' && !helpOpen && (
        <Result
          state={state}
          bestScore={Math.max(bestScore, state.score)}
          onReplay={onReplay}
          onHome={onHome}
          busy={busy}
        />
      )}
    </main>
  );
}
