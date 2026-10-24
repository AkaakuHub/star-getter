import {
  loveGatherHeartShowLimitSettings,
  resolveLoveGatherHeartDrawCount,
} from '../../domain/game/live/heartPresentation';

const storageKey = 'love-gather-heart-show-limit';

export function readHeartShowLimit(storage: Pick<Storage, 'getItem'>): number {
  const raw = storage.getItem(storageKey);
  if (raw === null) return loveGatherHeartShowLimitSettings.defaultValue;
  const value = Number(raw);
  resolveLoveGatherHeartDrawCount(0, value);
  return value;
}

export function writeHeartShowLimit(storage: Pick<Storage, 'setItem'>, value: number): void {
  resolveLoveGatherHeartDrawCount(0, value);
  storage.setItem(storageKey, String(value));
}
