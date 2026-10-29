import { useEffect } from 'preact/hooks';
import type { GameController } from './gameController';

export function usePortalNavigation(
  controller: GameController,
  onError: (message: string) => void,
): void {
  useEffect(() => {
    let resume = false;
    let pending = Promise.resolve();
    const update = (open: boolean) => {
      pending = pending
        .then(async () => {
          if (open) {
            resume = controller.state.phase === 'playing';
            if (resume) await controller.togglePause();
          } else {
            if (resume && controller.state.phase === 'paused') await controller.togglePause();
            resume = false;
          }
        })
        .catch((error: unknown) =>
          onError(error instanceof Error ? error.message : 'ゲームを一時停止できません。'),
        );
    };
    const open = () => update(true);
    const close = () => {
      controller.unlockAudio();
      update(false);
    };
    document.addEventListener('portal-menu-open', open);
    document.addEventListener('portal-menu-close', close);
    document.dispatchEvent(new Event('portal-menu-ready'));
    return () => {
      document.removeEventListener('portal-menu-open', open);
      document.removeEventListener('portal-menu-close', close);
    };
  }, [controller, onError]);
}
