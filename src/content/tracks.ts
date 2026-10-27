import { standardStage } from './stages';
import type { Track } from '@akaakuhub/suku-sute-core/game/model';
import { weatherSections, weatherTimeline } from './weatherTimeline';
import { stageTiming } from './balance';

export const tracks: readonly Track[] = [
  {
    id: 'weather-stage',
    name: '空模様',
    bpm: stageTiming.bpm,
    songTime: (stageTiming.durationSeconds * 1000) / 12,
    beats: (stageTiming.durationSeconds * stageTiming.bpm) / 60,
    stage: standardStage,
    masteryVoltageBonus: { demand: 0, gain: 0 },
    scoreLimit: { additionalEnabled: false, voltageMultipliers: [] },
    moodKeys: weatherTimeline,
    sections: weatherSections,
    ingameMissionGroups: [],
    afterMentalDownEffects: [],
  },
];
