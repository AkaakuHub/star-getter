import { routes, type RouteId } from '../../content/routes';
import type { GameState } from '../../domain/game/model';
import { paintResultGraph } from './paintResultGraph';

export async function createResultImage(state: GameState, route: RouteId): Promise<File> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('結果画像を描画できませんでした。');
  const scoreFont = '900 76px ui-monospace, monospace';
  context.font = scoreFont;
  const groups = state.score.toLocaleString('ja-JP').split(',');
  const scoreChunks = groups.map((group, index) => group + (index < groups.length - 1 ? ',' : ''));
  scoreChunks.push('スター');
  const scoreLines: string[] = [];
  let line = '';
  for (const chunk of scoreChunks) {
    if (line && context.measureText(line + chunk).width > 1072) {
      scoreLines.push(line);
      line = '';
    }
    line += chunk;
  }
  scoreLines.push(line);
  const extraHeight = (scoreLines.length - 1) * 90;
  canvas.height = 800 + extraHeight;
  context.fillStyle = '#fffaf5';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#353148';
  context.font = '800 40px sans-serif';
  context.fillText('スターギャザー', 64, 80);
  context.textAlign = 'right';
  context.font = '700 32px sans-serif';
  context.fillText(routes[route].name, 1136, 80);
  context.textAlign = 'left';
  context.font = scoreFont;
  for (const [index, scoreLine] of scoreLines.entries())
    context.fillText(scoreLine, 64, 192 + index * 90);
  context.font = '600 28px sans-serif';
  context.fillText(state.track.name, 64, 248 + extraHeight);
  context.save();
  context.translate(48, 290 + extraHeight);
  paintResultGraph(context, state, 1104, 450);
  context.restore();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('結果画像を作成できませんでした。'));
    }, 'image/png');
  });
  return new File([blob], `star-gather-${route}.png`, { type: 'image/png' });
}
