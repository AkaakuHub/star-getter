import type { GameState } from '../../domain/game/model';
import { heartCount } from '../../domain/game/hearts';
import { calculateStarGatherHeartRank } from '../../domain/game/live/heartRank';
import { projectStarGatherHeartPresentations } from '../../domain/game/live/heartPresentation';

export function paintHearts(
  context: CanvasRenderingContext2D,
  state: GameState,
  sprite: HTMLImageElement,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);
  const rank = calculateStarGatherHeartRank(
    heartCount(state),
    Math.floor(state.excitement / 2),
    null,
  );
  const pixelsPerWorldUnit = height / (9.600000381469727 * 2);
  const presentations = projectStarGatherHeartPresentations(state.hearts.stageHearts, rank.rank);
  let drawn = 0;
  for (const heart of presentations) {
    if (drawn >= state.hearts.showLimit) break;
    if (heart.alpha <= 0) continue;
    const worldX = width / 2 + heart.position.x * pixelsPerWorldUnit;
    const worldY = height / 2 - heart.position.y * pixelsPerWorldUnit;
    const x = worldX + (width / 2 - worldX) * heart.collectionProgress;
    const y =
      worldY +
      ((height * 111.5) / 1920 - worldY) * heart.collectionProgress -
      heart.collectionJumpHeight * pixelsPerWorldUnit;
    const size = width * 0.06 * heart.scale * heart.collectionScale;
    context.globalAlpha = heart.alpha;
    context.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    drawn++;
  }
  context.globalAlpha = 1;
}
