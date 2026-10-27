import { routes, type RouteId } from '../../content/routes';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';
import { formatScore } from '../cardDescription';
import { paintResultGraph } from './paintResultGraph';

export async function createResultImage(state: GameState, route: RouteId): Promise<File> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('結果画像を描画できませんでした。');
  context.fillStyle = '#fffaf5';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#353148';
  context.font = '800 40px sans-serif';
  context.fillText('star-getter', 64, 80);
  context.textAlign = 'right';
  context.font = '700 32px sans-serif';
  context.fillText(routes[route].name, 1136, 80);
  context.textAlign = 'left';
  context.font = '900 76px sans-serif';
  const scoreText = formatScore(state.score) + 'スター';
  const scoreFontSize = Math.min(76, (76 * 1072) / context.measureText(scoreText).width);
  context.font = `900 ${scoreFontSize}px sans-serif`;
  context.fillText(scoreText, 64, 192);
  context.font = '600 28px sans-serif';
  context.fillText(state.track.name, 64, 248);
  context.save();
  context.translate(48, 290);
  paintResultGraph(context, state, 1104, 450);
  context.restore();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('結果画像を作成できませんでした。'));
    }, 'image/png');
  });
  return new File([blob], `star-getter-${route}.png`, { type: 'image/png' });
}
