import { describe, expect, it } from 'vite-plus/test';
import { tracks } from '../../src/content/tracks';
import { compose } from '../../src/infrastructure/audio/composition';

describe('楽曲の合成データ', () => {
  for (const track of tracks) {
    it(`${track.name}を全区間で再生できる音符へ展開する`, () => {
      const notes = compose(track);
      expect((track.beats * 60) / track.bpm).toBe(30);
      expect(notes.length).toBeGreaterThan(track.beats);
      expect(new Set(notes.map((note) => note.voice)).size).toBe(5);
      let previousBeat = 0;
      for (const note of notes) {
        expect(note.beat).toBeGreaterThanOrEqual(previousBeat);
        expect(note.beat + note.length).toBeLessThanOrEqual(track.beats);
        expect(note.midi).toBeGreaterThan(0);
        expect(note.midi).toBeLessThan(128);
        expect(note.length).toBeGreaterThan(0);
        previousBeat = note.beat;
      }
      for (const section of track.sections) {
        expect(notes.some((note) => note.beat === section.startBeat && note.voice === 'lead')).toBe(
          true,
        );
      }
    });
  }
});
