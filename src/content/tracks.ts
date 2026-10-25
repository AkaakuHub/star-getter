import { standardStage } from './stages';
import type { Track } from '../domain/game/model';
import { weatherSections, weatherTimeline } from './weatherTimeline';
import { stageTiming } from './balance';

export const tracks: readonly Track[] = [
  {
    id: 'weather-stage',
    name: '空模様',
    bpm: stageTiming.bpm,
    songTime: 5000,
    beats: (stageTiming.durationSeconds * stageTiming.bpm) / 60,
    stage: standardStage,
    moodKeys: weatherTimeline,
    sections: weatherSections,
  },
];
