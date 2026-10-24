import type { Card, Track } from '../domain/game/model';
import { createGame } from '../domain/game/simulation';
import { AudioSession } from '../infrastructure/audio/audioSession';
import { GameController } from './gameController';

export async function createGameController(
  track: Track,
  deck: readonly Card[],
  muted: boolean,
): Promise<GameController> {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const value = random[0];
  if (value === undefined) throw new Error('ゲームの乱数を生成できません。');
  const state = createGame(track, deck, (value | 1) >>> 0);
  const audio = await AudioSession.create(track, muted);
  return new GameController(state, audio, {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (handle) => cancelAnimationFrame(handle),
  });
}
