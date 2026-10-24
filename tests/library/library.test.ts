import { describe, expect, it } from 'vite-plus/test';
import { defaultDeckIds } from '../../src/content/cards';
import { bestScore, readLibrary, writeLibrary } from '../../src/infrastructure/storage/library';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('編成と記録の保存', () => {
  it('初回は9枚の編成と各楽曲の得点0から始まる', () => {
    const library = readLibrary(new MemoryStorage());
    expect(library.deckIds).toEqual(defaultDeckIds);
    expect(Object.values(library.bestScores)).toEqual([0n, 0n]);
  });

  it('編成・選曲・ミュート・最高得点を保存して再読込できる', () => {
    const storage = new MemoryStorage();
    const initial = readLibrary(storage);
    const edited = {
      ...initial,
      muted: true,
      trackId: 'night-step',
      deckIds: initial.deckIds.map((id) => (id === 'spark' ? 'ember' : id)),
      bestScores: { ...initial.bestScores, 'night-step': 9999n * 10n ** 68n - 1n },
    };
    writeLibrary(storage, edited);
    expect(readLibrary(storage)).toEqual(edited);
    expect(bestScore(readLibrary(storage), 'night-step')).toBe(9999n * 10n ** 68n - 1n);
  });

  it('壊れた編成を保存せず、直前の有効なデータを維持する', () => {
    const storage = new MemoryStorage();
    const valid = readLibrary(storage);
    writeLibrary(storage, valid);
    expect(() => writeLibrary(storage, { ...valid, deckIds: ['spark'] })).toThrow();
    expect(readLibrary(storage)).toEqual(valid);
  });

  it('欠落した得点や不正なJSONを初期値へ置換せず拒否する', () => {
    const storage = new MemoryStorage();
    const valid = readLibrary(storage);
    storage.setItem('love-gather-library', JSON.stringify({ ...valid, bestScores: {} }));
    expect(() => readLibrary(storage)).toThrow();
    storage.setItem('love-gather-library', '{');
    expect(() => readLibrary(storage)).toThrow();
  });
});
