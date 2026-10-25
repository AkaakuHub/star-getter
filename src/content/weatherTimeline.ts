import type { MoodKey } from '../domain/game/live/moodTimeline';
import { stageTiming } from './balance';

const sourceSections = [
  { time: 0, name: 'イントロ', climax: false },
  { time: 28148, name: 'ウェーブ', climax: false },
  { time: 51852, name: 'ライジング', climax: false },
  { time: 75556, name: '山場', climax: true },
  { time: 105185, name: 'フィナーレ', climax: false },
] as const;
const sourceMoodKeys = [
  [0, 0],
  [2963, 0],
  [15926, 55],
  [28148, 40],
  [40000, 55],
  [48889, 40],
  [51852, -55],
  [57778, -40],
  [60741, -30],
  [66667, -40],
  [72593, 0],
  [74815, 90],
  [75556, 70],
  [90370, 55],
  [93333, 45],
  [99259, -45],
  [102222, -70],
  [105185, 70],
  [128889, 40],
  [131852, 25],
  [133333, 0],
] as const;

function gameSeconds(milliseconds: number): number {
  const firstSectionEnd = sourceSections[1].time;
  return milliseconds <= firstSectionEnd
    ? (milliseconds / firstSectionEnd) * stageTiming.preparationSeconds
    : stageTiming.preparationSeconds +
        ((milliseconds - firstSectionEnd) / (139259 - firstSectionEnd)) *
          (stageTiming.durationSeconds - stageTiming.preparationSeconds);
}

export const weatherSections = sourceSections.map(({ time, name, climax }) => ({
  name,
  startBeat: (gameSeconds(time) * stageTiming.bpm) / 60,
  climax,
}));
export const weatherTimeline: readonly MoodKey[] = sourceMoodKeys.map(([time, value]) => ({
  songTimeSeconds: gameSeconds(time),
  keyValue: value,
}));
