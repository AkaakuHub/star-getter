import { routes, type RouteId } from '../content/routes';
import { tracks } from '../content/tracks';
import { createGame } from '../domain/game/simulation';
import { LiveClock } from '../infrastructure/playback/liveClock';
import { GameController } from './gameController';

export function createGameController(routeId: RouteId, heartShowLimit: number): GameController {
  const route = routes[routeId];
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const value = random[0];
  if (value === undefined) throw new Error('ゲームの乱数を生成できません。');
  const state = createGame(track, route.deck, (value | 1) >>> 0, heartShowLimit, route.tokens);
  const clock = new LiveClock(() => performance.now() / 1000);
  return new GameController(state, clock, {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (handle) => cancelAnimationFrame(handle),
  });
}
