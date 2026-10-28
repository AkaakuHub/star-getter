import type { GamePreferences } from './gamePreferences';
import type { GameSetup } from './setup/gameSetup';
import { LiveClock } from '../infrastructure/playback/liveClock';
import { BrowserGameAudio } from '../infrastructure/audio/browserGameAudio';
import { GameController } from './gameController';
import { createConfiguredGame } from './createConfiguredGame';

export function createGameController(
  setup: GameSetup,
  heartShowLimit: number,
  preferences: GamePreferences,
): GameController {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const value = random[0];
  if (value === undefined) throw new Error('ゲームの乱数を生成できません。');
  const state = {
    ...createConfiguredGame(setup, (value | 1) >>> 0, heartShowLimit),
    automaticHeart: { enabled: preferences.automaticHearts, timerSeconds: 0 },
  };
  const clock = new LiveClock(() => performance.now() / 1000);
  return new GameController(
    state,
    clock,
    {
      request: (callback) => requestAnimationFrame(callback),
      cancel: (handle) => cancelAnimationFrame(handle),
    },
    new BrowserGameAudio(preferences.muted),
    preferences.waitMode,
  );
}
