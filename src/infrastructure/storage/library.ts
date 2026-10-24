import { cards, defaultDeckIds, resolveDeck } from '../../content/cards';
import { tracks } from '../../content/tracks';
import { validateDeck } from '../../domain/game/deck';

export type Library = Readonly<{
  deckIds: readonly string[];
  trackId: string;
  muted: boolean;
  bestScores: Readonly<Record<string, number>>;
}>;

const storageKey = 'love-gather-library';

export function bestScore(library: Library, trackId: string): number {
  const score = library.bestScores[trackId];
  if (score === undefined) throw new Error('楽曲の最高得点がありません。');
  return score;
}

function newLibrary(): Library {
  const track = tracks[0];
  if (!track) throw new Error('楽曲がありません。');
  return {
    deckIds: [...defaultDeckIds],
    trackId: track.id,
    muted: false,
    bestScores: Object.fromEntries(tracks.map((item) => [item.id, 0])),
  };
}

export function readLibrary(storage: Storage): Library {
  const raw = storage.getItem(storageKey);
  if (raw === null) return newLibrary();
  const parsed: unknown = JSON.parse(raw);
  return decodeLibrary(parsed);
}

export function writeLibrary(storage: Storage, library: Library): void {
  storage.setItem(storageKey, JSON.stringify(decodeLibrary(library)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeLibrary(value: unknown): Library {
  if (
    !isRecord(value) ||
    !Array.isArray(value.deckIds) ||
    !value.deckIds.every(
      (id: unknown): id is string => typeof id === 'string' && cards.some((card) => card.id === id),
    ) ||
    typeof value.trackId !== 'string' ||
    !tracks.some((track) => track.id === value.trackId) ||
    typeof value.muted !== 'boolean' ||
    !isRecord(value.bestScores)
  ) {
    throw new Error('保存データの形式が正しくありません。');
  }
  validateDeck(resolveDeck(value.deckIds));
  const bestScores: Record<string, number> = {};
  for (const track of tracks) {
    const score = value.bestScores[track.id];
    if (typeof score !== 'number' || !Number.isSafeInteger(score) || score < 0) {
      throw new Error('保存された得点が正しくありません。');
    }
    bestScores[track.id] = score;
  }
  return { deckIds: value.deckIds, trackId: value.trackId, muted: value.muted, bestScores };
}
