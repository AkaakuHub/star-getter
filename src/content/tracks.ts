import { standardStage } from './stages';
import type { Track } from '../domain/game/model';

export const tracks: readonly Track[] = [
  {
    id: 'weather-stage',
    name: '空模様',
    bpm: 120,
    beats: 120,
    stage: standardStage,
    sections: [
      { name: 'イントロ', startBeat: 0, mood: 'warm', moodValue: 50, climax: false },
      { name: 'ウェーブ', startBeat: 24, mood: 'cool', moodValue: -100, climax: false },
      { name: 'ライジング', startBeat: 48, mood: 'bright', moodValue: 0, climax: false },
      { name: '山場', startBeat: 72, mood: 'warm', moodValue: 50, climax: true },
      { name: 'フィナーレ', startBeat: 96, mood: 'bright', moodValue: 0, climax: false },
    ],
  },
];
