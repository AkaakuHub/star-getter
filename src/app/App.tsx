import { CircleHelp, Volume2, VolumeX, X } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import { resolveDeck } from '../content/cards';
import { tracks } from '../content/tracks';
import { bestScore, type Library, writeLibrary } from '../infrastructure/storage/library';
import { GameView } from '../presentation/components/GameView';
import { HowToPlay } from '../presentation/components/HowToPlay';
import { Lobby } from '../presentation/components/Lobby';
import type { GameController } from './gameController';
import { createGameController } from './createGameController';
import { useGameControls } from './useGameControls';
import { readHeartShowLimit, writeHeartShowLimit } from '../infrastructure/storage/heartDisplay';

export function App({ initialLibrary }: Readonly<{ initialLibrary: Library }>) {
  const [library, setLibrary] = useState(initialLibrary);
  const [heartShowLimit, setHeartShowLimit] = useState(() => readHeartShowLimit(localStorage));
  const [controller, setController] = useState<GameController | null>(null);
  const [error, setError] = useState('');
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, refresh] = useState(0);
  const state = controller?.state;
  useGameControls(controller, help);

  useEffect(() => controller?.subscribe(() => refresh((value) => value + 1)), [controller]);
  useEffect(() => {
    return () => {
      if (controller) void controller.dispose();
    };
  }, [controller]);
  useEffect(() => {
    if (state?.phase === 'finished' && state.score > bestScore(library, state.track.id)) {
      changeLibrary({
        ...library,
        bestScores: { ...library.bestScores, [state.track.id]: state.score },
      });
    }
  }, [state?.phase, state?.score, state?.track.id, library]);

  function changeLibrary(next: Library): void {
    try {
      writeLibrary(localStorage, next);
      setLibrary(next);
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '設定を保存できません。');
    }
  }

  async function start(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const track = tracks.find((item) => item.id === library.trackId);
      if (!track) throw new Error('選択された楽曲がありません。');
      if (controller) await controller.dispose();
      const next = await createGameController(
        track,
        resolveDeck(library.deckIds),
        library.muted,
        heartShowLimit,
      );
      setController(next);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'ライブを開始できません。');
    } finally {
      setBusy(false);
    }
  }

  async function home(): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      await controller?.dispose();
      setController(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'ライブを終了できません。');
    } finally {
      setBusy(false);
    }
  }

  function toggleMute(): void {
    const next = !library.muted;
    changeLibrary({ ...library, muted: next });
    controller?.setMuted(next);
  }

  function showHelp(): void {
    setHelp(true);
    if (controller?.state.phase === 'playing') void controller.togglePause();
  }

  const message = error || controller?.error;
  return (
    <div className={'app-shell ' + (controller ? 'is-playing' : '')}>
      {!controller && (
        <header className="app-header">
          <h1>
            ラブギャザー
            <span className="brand-dot" aria-hidden="true" />
          </h1>
          <nav aria-label="設定">
            <button
              type="button"
              className="icon-button"
              aria-label={library.muted ? '音声を有効にする' : '音声をミュート'}
              aria-pressed={!library.muted}
              onClick={toggleMute}
            >
              {library.muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
            </button>
            <button type="button" className="icon-button" aria-label="遊び方" onClick={showHelp}>
              <CircleHelp aria-hidden="true" />
            </button>
          </nav>
        </header>
      )}
      {message && (
        <div role="alert" className="error-banner">
          <span>{message}</span>
          {error && (
            <button
              type="button"
              className="icon-button"
              aria-label="エラーを閉じる"
              onClick={() => setError('')}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      {controller && state ? (
        <GameView
          controller={controller}
          state={state}
          bestScore={bestScore(library, state.track.id)}
          onHome={() => void home()}
          onReplay={() => void start()}
          onPause={() => void controller.togglePause()}
          helpOpen={help}
          busy={busy}
        />
      ) : (
        <Lobby
          library={library}
          heartShowLimit={heartShowLimit}
          onHeartShowLimit={(value) => {
            try {
              writeHeartShowLimit(localStorage, value);
              setHeartShowLimit(value);
              setError('');
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : '設定を保存できません。');
            }
          }}
          onChange={changeLibrary}
          onStart={() => void start()}
          busy={busy}
        />
      )}
      {help && <HowToPlay onClose={() => setHelp(false)} />}
    </div>
  );
}
