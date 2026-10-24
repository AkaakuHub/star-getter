import { cards, defaultDeckIds, resolveDeck } from '../../content/cards';
import { tracks } from '../../content/tracks';
import { validateDeck } from '../../domain/game/deck';
import { rules } from '../../domain/game/model';

export type Library = Readonly<{
  deckIds: readonly string[];
  trackId: string;
  muted: boolean;
  bestScores: Readonly<Record<string, bigint>>;
}>;

const storageKey = 'love-gather-library';

export function bestScore(library: Library, trackId: string): bigint {
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
    bestScores: Object.fromEntries(tracks.map((item) => [item.id, 0n])),
  };
}

export function readLibrary(storage: Storage): Library {
  const raw = storage.getItem(storageKey);
  if (raw === null) return newLibrary();
  const parsed: unknown = JSON.parse(
    raw,
    (key: string, value: unknown, context?: Readonly<{ source: string }>): unknown => {
      if (!tracks.some((track) => track.id === key)) return value;
      if (!context || !/^(0|[1-9]\d*)$/.test(context.source))
        throw new Error('保存された得点が正しくありません。');
      return BigInt(context.source);
    },
  );
  return decodeLibrary(parsed);
}

export function writeLibrary(storage: Storage, library: Library): void {
  const valid = decodeLibrary(library);
  const settings = JSON.stringify({
    deckIds: valid.deckIds,
    trackId: valid.trackId,
    muted: valid.muted,
  });
  const scores = Object.entries(valid.bestScores)
    .map(([id, score]) => `${JSON.stringify(id)}:${score}`)
    .join(',');
  storage.setItem(storageKey, `${settings.slice(0, -1)},"bestScores":{${scores}}}`);
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
  const bestScores: Record<string, bigint> = {};
  for (const track of tracks) {
    const score = value.bestScores[track.id];
    if (typeof score !== 'bigint' || score < 0n || score > rules.maxScore) {
      throw new Error('保存された得点が正しくありません。');
    }
    bestScores[track.id] = score;
  }
  return { deckIds: value.deckIds, trackId: value.trackId, muted: value.muted, bestScores };
}
