import { defaultGamePreferences, type GamePreferences } from '../../app/gamePreferences';

const storageKey = 'star-gather-preferences';

export function readGamePreferences(storage: Pick<Storage, 'getItem'>): GamePreferences {
  const raw = storage.getItem(storageKey);
  if (raw === null) return defaultGamePreferences;
  const value: unknown = JSON.parse(raw);
  if (
    typeof value !== 'object' ||
    value === null ||
    !('muted' in value) ||
    typeof value.muted !== 'boolean' ||
    !('automaticHearts' in value) ||
    typeof value.automaticHearts !== 'boolean' ||
    !('waitMode' in value) ||
    typeof value.waitMode !== 'boolean'
  )
    throw new Error('保存された設定が正しくありません。');
  return { muted: value.muted, automaticHearts: value.automaticHearts, waitMode: value.waitMode };
}

export function writeGamePreferences(
  storage: Pick<Storage, 'setItem'>,
  preferences: GamePreferences,
): void {
  storage.setItem(storageKey, JSON.stringify(preferences));
}
