import { routes, type RouteId } from '../content/routes';
import { tracks } from '../content/tracks';
import { createGame } from '../domain/game/simulation';
import { AudioSession } from '../infrastructure/audio/audioSession';
import { GameController } from './gameController';

export function createGameController(
  routeId: RouteId,
  muted: boolean,
  heartShowLimit: number,
): GameController {
  const route = routes[routeId];
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const value = random[0];
  if (value === undefined) throw new Error('ゲームの乱数を生成できません。');
  const state = createGame(track, route.deck, (value | 1) >>> 0, heartShowLimit, route.tokens);
  const audio = AudioSession.create(track, muted);
  return new GameController(state, audio, {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (handle) => cancelAnimationFrame(handle),
  });
}
