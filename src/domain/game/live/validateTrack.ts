import { validateMoodTimeline } from './moodTimeline';
import type { Track } from '../model';

export function validateTrack(track: Track): void {
  if (
    !Number.isFinite(track.bpm) ||
    track.bpm < 30 ||
    track.bpm > 300 ||
    !Number.isInteger(track.beats) ||
    track.beats < 1 ||
    track.beats > 2000 ||
    track.sections[0]?.startBeat !== 0
  )
    throw new Error('ステージの設定が正しくありません。');
  let previous = -1;
  for (const section of track.sections) {
    if (
      !Number.isFinite(section.startBeat) ||
      section.startBeat <= previous ||
      section.startBeat >= track.beats
    ) {
      throw new Error('区間の設定が正しくありません。');
    }
    previous = section.startBeat;
  }
  validateMoodTimeline(track.moodKeys, (track.beats * 60) / track.bpm);
}
