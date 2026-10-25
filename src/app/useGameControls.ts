import { useEffect } from 'preact/hooks';
import type { GameController } from './gameController';

export function useGameControls(
  controller: GameController | null,
  helpOpen: boolean,
  onSpecial: () => void,
): void {
  useEffect(() => {
    if (!controller) return;
    const keyboard = (event: KeyboardEvent) => {
      if (event.repeat || helpOpen || event.altKey || event.ctrlKey || event.metaKey) return;
      if (
        event.target instanceof Element &&
        event.target.closest('dialog, input, textarea, select, [contenteditable="true"]')
      )
        return;
      const index = ['1', '2', '3', '4', '5', '6', '7', '8'].indexOf(event.key);
      if (index >= 0) {
        event.preventDefault();
        controller.tapCard(index);
      }
      if (
        event.key === ' ' &&
        !(event.target instanceof Element && event.target.closest('button'))
      ) {
        event.preventDefault();
        controller.collectFromInput();
      }
      if (
        event.key.toLowerCase() === 's' ||
        (event.key === 'Enter' &&
          !(event.target instanceof Element && event.target.closest('button, a')))
      ) {
        event.preventDefault();
        onSpecial();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        void controller.toggleWaitMode();
      }
    };
    const visibility = () => {
      if (document.hidden && controller.state.phase === 'playing') void controller.togglePause();
    };
    window.addEventListener('keydown', keyboard);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('keydown', keyboard);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [controller, helpOpen, onSpecial]);
}
