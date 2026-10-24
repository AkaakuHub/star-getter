import type { Track } from '../domain/game/model';

export const tracks: readonly Track[] = [
  {
    id: 'sea-signal',
    name: '潮風シグナル',
    bpm: 120,
    beats: 160,
    targetScore: 62000,
    sections: [
      { name: 'イントロ', startBeat: 0, mood: 'warm', climax: false },
      { name: 'ウェーブ', startBeat: 32, mood: 'cool', climax: false },
      { name: 'ライジング', startBeat: 64, mood: 'bright', climax: false },
      { name: 'クライマックス', startBeat: 96, mood: 'warm', climax: true },
      { name: 'フィナーレ', startBeat: 128, mood: 'bright', climax: false },
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
  {
    id: 'night-step',
    name: 'ミッドナイト・ステップ',
    bpm: 132,
    beats: 192,
    targetScore: 76000,
    sections: [
      { name: 'イントロ', startBeat: 0, mood: 'cool', climax: false },
      { name: 'グルーヴ', startBeat: 32, mood: 'bright', climax: false },
      { name: 'フロウ', startBeat: 64, mood: 'warm', climax: false },
      { name: 'クライマックス', startBeat: 112, mood: 'cool', climax: true },
      { name: 'フィナーレ', startBeat: 160, mood: 'bright', climax: false },
    ],
    melody: [
      69, 72, 76, 79, 76, 72, 71, 67, 69, 71, 72, 76, 74, 72, 71, 69, 65, 69, 72, 74, 72, 69, 67,
      64, 64, 67, 71, 74, 76, 74, 71, 67,
    ],
    chords: [
      [45, 48, 52],
      [41, 45, 48],
      [48, 52, 55],
      [43, 47, 50],
    ],
  },
];
