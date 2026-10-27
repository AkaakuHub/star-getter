import { useCallback, useEffect, useState } from 'preact/hooks';
import type { RouteId } from '../content/routes';
import { readHeartShowLimit, writeHeartShowLimit } from '../infrastructure/storage/heartDisplay';
import { GameView } from '../presentation/components/GameView';
import { GameMenu } from '../presentation/components/GameMenu';
import { CardBrowser } from '../presentation/cards/CardBrowser';
import { createGameController } from './createGameController';
import {
  readGamePreferences,
  writeGamePreferences,
} from '../infrastructure/storage/gamePreferences';
import type { GamePreferences } from './gamePreferences';
import { initialRoute, routeUrl } from './initialRoute';
import { useGameControls } from './useGameControls';
import { hasAvailableSpecial } from '@akaakuhub/suku-sute-core/game/special';
import { SpecialSelection } from '../presentation/special/SpecialSelection';

type Panel = 'menu' | 'hand' | 'deck' | 'special';

export function App() {
  const [route, setRoute] = useState(() => initialRoute(location.href));
  const [heartShowLimit, setHeartShowLimit] = useState(() => readHeartShowLimit(localStorage));
  const [preferences, setPreferences] = useState(() => readGamePreferences(localStorage));
  const [controller, setController] = useState(() =>
    createGameController(route, heartShowLimit, preferences),
  );
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

  useEffect(() => {
    history.replaceState(null, '', routeUrl(route, location.href));
  }, [route]);

  const savePreferences = useCallback((next: GamePreferences): void => {
    writeGamePreferences(localStorage, next);
    setPreferences(next);
  }, []);

  const changeWaitMode = useCallback(async (): Promise<void> => {
    await controller.toggleWaitMode();
    savePreferences({ ...preferences, waitMode: controller.waitModeEnabled });
  }, [controller, preferences, savePreferences]);

  async function restart(nextRoute: RouteId): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      await controller.dispose();
      const next = createGameController(nextRoute, heartShowLimit, preferences);
      history.replaceState(null, '', routeUrl(nextRoute, location.href));
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
  useGameControls(controller, panel !== null, openSpecial, changeWaitMode);

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
    <div
      className="app-shell is-playing"
      onPointerDownCapture={() => controller.unlockAudio()}
      onKeyDownCapture={() => controller.unlockAudio()}
    >
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
        onWaitMode={() => void changeWaitMode()}
        onMenu={() => void openPanel('menu')}
        onHand={() => void openPanel('hand')}
        onDeck={() => void openPanel('deck')}
        onSpecial={openSpecial}
        muted={preferences.muted}
        onMuted={() => {
          controller.setMuted(!preferences.muted);
          savePreferences({ ...preferences, muted: !preferences.muted });
        }}
        onAutomaticHearts={() => {
          controller.toggleAutomaticHearts();
          savePreferences({
            ...preferences,
            automaticHearts: controller.state.automaticHeart.enabled,
          });
        }}
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
