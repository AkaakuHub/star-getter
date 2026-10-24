import type { GameState } from '../../domain/game/model';
import { calculateLoveGatherHeartRank } from '../../domain/game/live/heartRank';
import {
  projectLoveGatherHeartPresentations,
  resolveLoveGatherHeartDrawCount,
} from '../../domain/game/live/heartPresentation';
import { heartCount } from '../../domain/game/hearts';

export function heartLayout(state: GameState) {
  const rank = calculateLoveGatherHeartRank(
    heartCount(state),
    Math.floor(state.excitement / 2),
    null,
  );
  const presentations = projectLoveGatherHeartPresentations(state.hearts.stageHearts, rank.rank);
  const count = resolveLoveGatherHeartDrawCount(presentations.length, state.hearts.showLimit);
  const pixelsPerWorldUnit = 1920 / (9.600000381469727 * 2);
  return presentations.slice(0, count).map((heart) => {
    const worldCenterX = 540 + heart.position.x * pixelsPerWorldUnit;
    const worldCenterY = 960 - heart.position.y * pixelsPerWorldUnit;
    const centerX = worldCenterX + (540 - worldCenterX) * heart.collectionProgress;
    const centerY =
      worldCenterY +
      (111.5 - worldCenterY) * heart.collectionProgress -
      heart.collectionJumpHeight * pixelsPerWorldUnit;
    return {
      left: centerX / 10.8 + '%',
      top: centerY / 19.2 + '%',
      opacity: heart.alpha,
      transform: `translate(-50%, -50%) scale(${heart.scale * heart.collectionScale})`,
    };
  });
}
