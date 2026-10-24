import type { Track } from '../domain/game/model';

export const tracks: readonly Track[] = [
  {
    id: 'sea-signal',
    name: '潮風シグナル',
    bpm: 120,
    beats: 60,
    sections: [
      { name: 'イントロ', startBeat: 0, mood: 'warm', climax: false },
      { name: 'ウェーブ', startBeat: 12, mood: 'cool', climax: false },
      { name: 'ライジング', startBeat: 24, mood: 'bright', climax: false },
      { name: 'クライマックス', startBeat: 36, mood: 'warm', climax: true },
      { name: 'フィナーレ', startBeat: 48, mood: 'bright', climax: false },
    ],
    melody: [
      72, 76, 79, 76, 74, 72, 67, 69, 72, 74, 76, 79, 81, 79, 76, 74, 65, 69, 72, 76, 74, 72, 69,
      67, 67, 71, 74, 79, 77, 74, 71, 67,
    ],
    chords: [
      [48, 52, 55],
      [45, 48, 52],
      [41, 45, 48],
      [43, 47, 50],
    ],
  },
];
