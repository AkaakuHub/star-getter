import type { Track } from '../../domain/game/model';

type Voice = 'lead' | 'chord' | 'bass' | 'kick' | 'hat';
export type Note = Readonly<{ beat: number; midi: number; length: number; voice: Voice }>;

export function compose(track: Track): readonly Note[] {
  const notes: Note[] = [];
  for (let halfBeat = 0; halfBeat < track.beats * 2; halfBeat++) {
    const beat = halfBeat / 2;
    const phrase = Math.floor(beat / 16);
    const chord = track.chords[Math.floor(beat / 8) % track.chords.length];
    const melody = track.melody[(halfBeat + phrase * 8) % track.melody.length];
    if (!chord || melody === undefined) throw new Error('楽曲の音符がありません。');
    const section = track.sections.findLast((item) => item.startBeat <= beat);
    if (halfBeat % 2 === 0 || section?.climax) {
      notes.push({ beat, midi: melody, length: 0.42, voice: 'lead' });
    }
    if (halfBeat % 8 === 0) {
      notes.push(
        ...chord.map((midi): Note => ({ beat, midi: midi + 12, length: 3.3, voice: 'chord' })),
      );
    }
    if (halfBeat % 4 === 0) {
      notes.push({ beat, midi: chord[0] - 12, length: 0.7, voice: 'bass' });
    }
    if (halfBeat % 2 === 0) notes.push({ beat, midi: 36, length: 0.28, voice: 'kick' });
    notes.push({ beat, midi: 100, length: 0.05, voice: 'hat' });
  }
  return notes;
}
