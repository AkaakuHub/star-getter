import type { RouteId } from '../content/routes';
import { LiveClock } from '../infrastructure/playback/liveClock';
import { BrowserGameAudio } from '../infrastructure/audio/browserGameAudio';
import { GameController } from './gameController';
import { createPresetGame } from './createPresetGame';

export function createGameController(
  routeId: RouteId,
  heartShowLimit: number,
  muted: boolean,
): GameController {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const value = random[0];
  if (value === undefined) throw new Error('ゲームの乱数を生成できません。');
  const state = createPresetGame(routeId, (value | 1) >>> 0, heartShowLimit);
  const clock = new LiveClock(() => performance.now() / 1000);
  return new GameController(
    state,
    clock,
    {
      request: (callback) => requestAnimationFrame(callback),
      cancel: (handle) => cancelAnimationFrame(handle),
    },
    new BrowserGameAudio(muted),
  );
}
