import { changeStarGatherHeartLimit } from '../live/heartLimit';
import type { GameState } from '../model';

export function applyHeartLimit(state: GameState, amount: number): GameState {
  return {
    ...state,
    hearts: changeStarGatherHeartLimit(
      state.hearts,
      Math.min(10_000_000, state.hearts.heartLimit + Math.ceil(amount)),
    ).state,
  };
}
