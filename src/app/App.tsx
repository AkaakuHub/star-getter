import { useCallback, useEffect, useState } from 'preact/hooks';
import type { RouteId } from '../content/routes';
import { readHeartShowLimit, writeHeartShowLimit } from '../infrastructure/storage/heartDisplay';
import { GameView } from '../presentation/components/GameView';
import { GameMenu } from '../presentation/components/GameMenu';
import { CardBrowser } from '../presentation/cards/CardBrowser';
import { createGameController } from './createGameController';
import { initialRoute } from './initialRoute';
import { useGameControls } from './useGameControls';
import { hasAvailableSpecial } from '../domain/game/special';
import { SpecialSelection } from '../presentation/special/SpecialSelection';

type Panel = 'menu' | 'hand' | 'deck' | 'special';

export function App() {
  const [route, setRoute] = useState(() => initialRoute(location.href));
  const [heartShowLimit, setHeartShowLimit] = useState(() => readHeartShowLimit(localStorage));
  const [controller, setController] = useState(() => createGameController(route, heartShowLimit));
  const [panel, setPanel] = useState<Panel | null>(null);
  const [resumeAfterPanel, setResumeAfterPanel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [, refresh] = useState(0);
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
      const next = createGameController(nextRoute, heartShowLimit);
      const url = new URL(location.href);
      url.searchParams.set('route', nextRoute);
      history.replaceState(null, '', url);
      setRoute(nextRoute);
      setController(next);
      setPanel(null);
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'ライブを開始できません。');
    } finally {
      setBusy(false);
    }
  }

  const openPanel = useCallback(
    async (kind: Panel): Promise<void> => {
      if (busy || panel !== null) return;
      const playing = controller.state.phase === 'playing';
      if (kind === 'special' && (!playing || !hasAvailableSpecial(controller.state))) return;
      setBusy(true);
      try {
        if (playing) await controller.togglePause();
        if (controller.state.phase === 'playing') return;
        if (kind === 'special' && controller.state.phase !== 'paused') return;
        setResumeAfterPanel(playing);
        setPanel(kind);
      } finally {
        setBusy(false);
      }
    },
    [busy, controller, panel],
  );

  const openSpecial = useCallback(() => void openPanel('special'), [openPanel]);
  useGameControls(controller, panel !== null, openSpecial);

  async function closePanel(specialCardId?: string): Promise<void> {
    if (busy) return;
    setBusy(true);
    setPanel(null);
    setResumeAfterPanel(false);
    try {
      if (resumeAfterPanel && controller.state.phase === 'paused') await controller.togglePause();
      if (specialCardId !== undefined)
        controller.command({ type: 'special', cardId: specialCardId });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'ライブを再開できません。');
    } finally {
      setBusy(false);
    }
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
        onDeck={() => void openPanel('deck')}
        onSpecial={openSpecial}
        busy={busy}
      />
      {panel === 'menu' && (
        <GameMenu
          route={route}
          heartShowLimit={heartShowLimit}
          busy={busy}
          onRoute={(nextRoute) => void restart(nextRoute)}
          onHeartShowLimit={changeHeartShowLimit}
          onClose={() => void closePanel()}
        />
      )}
      {(panel === 'hand' || panel === 'deck') && (
        <CardBrowser
          state={controller.state}
          initialBoard={panel}
          onClose={() => void closePanel()}
        />
      )}
      {panel === 'special' && (
        <SpecialSelection
          state={controller.state}
          busy={busy}
          onUse={(cardId) => void closePanel(cardId)}
          onClose={() => void closePanel()}
        />
      )}
    </div>
  );
}
