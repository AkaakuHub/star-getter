import {
  starGatherHeartShowLimitSettings,
  resolveStarGatherHeartDrawCount,
} from '../../domain/game/live/heartPresentation';

const storageKey = 'love-gather-heart-show-limit';

export function readHeartShowLimit(storage: Pick<Storage, 'getItem'>): number {
  const raw = storage.getItem(storageKey);
  if (raw === null) return starGatherHeartShowLimitSettings.defaultValue;
  const value = Number(raw);
  resolveStarGatherHeartDrawCount(0, value);
  return value;
}

export function writeHeartShowLimit(storage: Pick<Storage, 'setItem'>, value: number): void {
  resolveStarGatherHeartDrawCount(0, value);
  storage.setItem(storageKey, String(value));
}
