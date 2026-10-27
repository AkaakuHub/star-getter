import type { Track } from '@akaakuhub/suku-sute-core/game/model';
import { projectMoodStepPoints } from '@akaakuhub/suku-sute-core/game/live/moodGraph';

export function paintMoodGraph(context: CanvasRenderingContext2D, track: Track): void {
  const width = 750;
  const height = 170;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#a4496a';
  context.fillRect(0, 0, width, height / 2);
  context.fillStyle = '#49648b';
  context.fillRect(0, height / 2, width, height / 2);
  for (const [index, section] of track.sections.entries()) {
    const start = (section.startBeat / track.beats) * width;
    const end = ((track.sections[index + 1]?.startBeat ?? track.beats) / track.beats) * width;
    if (section.climax) {
      context.fillStyle = '#f5d67e66';
      context.fillRect(start, 0, end - start, height);
    }
    context.strokeStyle = '#de3de9';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(start, 0);
    context.lineTo(start, height);
    context.stroke();
  }
  context.strokeStyle = '#ffffff55';
  context.lineWidth = 1;
  for (const y of [0, height / 2, height]) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  const points = projectMoodStepPoints(track.moodKeys, (track.beats * 60) / track.bpm, {
    x: 0,
    y: 0,
    width,
    height,
  });
  context.strokeStyle = '#f2f2f2';
  context.lineWidth = 3;
  context.beginPath();
  for (const [index, point] of points.entries()) {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  }
  context.stroke();
}
