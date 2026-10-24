import { useEffect, useState } from 'preact/hooks';
import type { RouteId } from '../content/routes';
import { readHeartShowLimit, writeHeartShowLimit } from '../infrastructure/storage/heartDisplay';
import { GameView } from '../presentation/components/GameView';
import { GameMenu } from '../presentation/components/GameMenu';
import { HandPanel } from '../presentation/components/HandPanel';
import { createGameController } from './createGameController';
import { initialRoute } from './initialRoute';
import { useGameControls } from './useGameControls';

export function App() {
  const [route, setRoute] = useState(() => initialRoute(location.href));
  const [heartShowLimit, setHeartShowLimit] = useState(() => readHeartShowLimit(localStorage));
  const [muted, setMuted] = useState(false);
  const [controller, setController] = useState(() =>
    createGameController(route, muted, heartShowLimit),
  );
  const [menu, setMenu] = useState(false);
  const [handOpen, setHandOpen] = useState(false);
  const [resumeAfterMenu, setResumeAfterMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [, refresh] = useState(0);
  useGameControls(controller, menu || handOpen);
  useEffect(() => controller.subscribe(() => refresh((value) => value + 1)), [controller]);
  useEffect(
    () => () => {
      void controller.dispose();
    },
    [controller],
  );

  async function restart(nextRoute: RouteId): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      await controller.dispose();
      const next = createGameController(nextRoute, muted, heartShowLimit);
      const url = new URL(location.href);
      url.searchParams.set('route', nextRoute);
      history.replaceState(null, '', url);
      setRoute(nextRoute);
      setController(next);
      setMenu(false);
      setHandOpen(false);
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'ライブを開始できません。');
    } finally {
      setBusy(false);
    }
  }

  async function openPanel(kind: 'menu' | 'hand'): Promise<void> {
    if (busy) return;
    const playing = controller.state.phase === 'playing';
    setBusy(true);
    if (playing) await controller.togglePause();
    setResumeAfterMenu(playing);
    if (kind === 'menu') setMenu(true);
    else setHandOpen(true);
    setBusy(false);
  }

  function changeHeartShowLimit(value: number): void {
    try {
      writeHeartShowLimit(localStorage, value);
      controller.setHeartShowLimit(value);
      setHeartShowLimit(value);
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '設定を保存できません。');
    }
  }

  return (
    <div className="app-shell is-playing">
      {(error || controller.error) && (
        <p role="alert" className="error-banner">
          {error || controller.error}
        </p>
      )}
      <GameView
        controller={controller}
        state={controller.state}
        route={route}
        onReplay={() => void restart(route)}
        onWaitMode={() => void controller.toggleWaitMode()}
        onMenu={() => void openPanel('menu')}
        onHand={() => void openPanel('hand')}
        busy={busy}
        muted={muted}
        onMuted={() => {
          controller.setMuted(!muted);
          setMuted(!muted);
        }}
      />
      {menu && (
        <GameMenu
          route={route}
          heartShowLimit={heartShowLimit}
          busy={busy}
          onRoute={(nextRoute) => void restart(nextRoute)}
          onHeartShowLimit={changeHeartShowLimit}
          onClose={() => {
            setMenu(false);
            if (resumeAfterMenu) void controller.togglePause();
          }}
        />
      )}
      {handOpen && (
        <HandPanel
          controller={controller}
          onClose={() => {
            setHandOpen(false);
            if (resumeAfterMenu) void controller.togglePause();
          }}
          onInspect={() => setHandOpen(false)}
        />
      )}
    </div>
  );
}
