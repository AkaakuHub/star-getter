import type { Track } from '../domain/game/model';

export const tracks: readonly Track[] = [
  {
    id: 'sea-signal',
    name: '潮風シグナル',
    bpm: 120,
    beats: 60,
    sections: [
      { name: 'イントロ', startBeat: 0, mood: 'warm', moodValue: 50, climax: false },
      { name: 'ウェーブ', startBeat: 12, mood: 'cool', moodValue: -100, climax: false },
      { name: 'ライジング', startBeat: 24, mood: 'bright', moodValue: 0, climax: false },
      { name: '山場', startBeat: 36, mood: 'warm', moodValue: 50, climax: true },
      { name: 'フィナーレ', startBeat: 48, mood: 'bright', moodValue: 0, climax: false },
    ],
  },
];
