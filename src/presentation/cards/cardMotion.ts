import type { CardUse } from '@akaakuhub/suku-sute-core/game/model';
import { handGeometry } from '../handLayout';

export const cardMotionDuration = 1000;

export function cardMotion(action: CardUse, elapsedMilliseconds: number) {
  const start = handGeometry(action.handIndex, action.handCount);
  const progress = Math.max(0, Math.min(1, elapsedMilliseconds / 250));
  const fade = Math.max(0, Math.min(1, (elapsedMilliseconds - 750) / 250));
  return {
    x: start.x + ((1080 - start.width) / 2 - start.x) * progress,
    y: start.y + ((1920 - start.height) / 2 - start.y) * progress,
    width: start.width,
    height: start.height,
    rotation: start.rotation * (1 - progress),
    alpha: (1 - fade) ** 2,
  };
}

export function cardMotionKeyframes(action: CardUse): Keyframe[] {
  const start = cardMotion(action, 0);
  const center = cardMotion(action, 250);
  const destination = `translate(${(center.x - start.x) / 10.8}cqw, calc(${(center.y - start.y) / 10.8}cqw + env(safe-area-inset-bottom))) rotate(0deg)`;
  return [
    { offset: 0, transform: `rotate(${start.rotation}deg)`, opacity: 1 },
    { offset: 0.25, transform: destination, opacity: 1 },
    {
      offset: 0.75,
      transform: destination,
      opacity: 1,
      easing: 'cubic-bezier(0.3333333333, 0.6666666667, 0.6666666667, 1)',
    },
    { offset: 1, transform: destination, opacity: 0 },
  ];
}
