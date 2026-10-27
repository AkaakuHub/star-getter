import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { formatScore } from '../cardDescription';
import { projectScoreGraph } from './scoreGraph';

export function paintResultGraph(
  context: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
): void {
  const fontSize = Math.max(12, width / 26);
  const left = fontSize * 1.6;
  const right = width - fontSize * 3.5;
  const top = fontSize * 1.8;
  const bottom = height - fontSize * 2.4;
  const graphWidth = right - left;
  const graphHeight = bottom - top;
  const display = projectScoreGraph(state.scoreHistory, state.moodHistory);
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#fffaf5';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#b83b66';
  context.font = `700 ${fontSize}px sans-serif`;
  context.textAlign = 'left';
  context.textBaseline = 'bottom';
  context.fillText(formatScore(display.maximumScore) + 'STAR', left, top - fontSize * 0.3);
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  context.fillText('0', left - fontSize * 0.4, bottom);
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillText('0秒', left, bottom + fontSize * 1.7);
  context.textAlign = 'right';
  context.fillText(display.maximumTimeSeconds + '秒', right, bottom + fontSize * 1.7);
  context.fillStyle = '#8d6515';
  context.textBaseline = 'bottom';
  context.fillText('空模様', right, top - fontSize * 0.3);
  context.textBaseline = 'middle';
  for (const [value, y] of [
    ['+100%', top],
    ['0%', top + graphHeight / 2],
    ['−100%', bottom],
  ] as const)
    context.fillText(value, width, y);
  context.lineWidth = Math.max(1, width / 750);
  context.strokeStyle = '#d9cbd5';
  context.beginPath();
  context.moveTo(left, top);
  context.lineTo(left, bottom);
  context.lineTo(right, bottom);
  context.stroke();
  context.strokeStyle = '#c3932366';
  context.lineWidth = (width / 750) * 2;
  context.lineJoin = 'round';
  context.beginPath();
  for (const [index, point] of display.moodPoints.entries()) {
    const x = left + point.x * graphWidth;
    const y = bottom - point.y * graphHeight;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
  context.strokeStyle = '#d94e7d';
  context.lineWidth = (width / 750) * 4;
  context.beginPath();
  for (const [index, point] of display.points.entries()) {
    const x = left + point.x * graphWidth;
    const y = bottom - point.y * graphHeight;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}
