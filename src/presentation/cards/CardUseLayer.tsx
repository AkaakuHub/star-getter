import { useLayoutEffect, useRef } from 'preact/hooks';
import type { GameController } from '../../app/gameController';
import { type CardUse, rules } from '@akaakuhub/suku-sute-core/game/model';
import { HandCardFace } from './HandCardFace';
import { cardMotion, cardMotionDuration, cardMotionKeyframes } from './cardMotion';

export function CardUseLayer({ controller }: Readonly<{ controller: GameController }>) {
  return (
    <div className="card-use-layer" aria-hidden="true">
      {controller.state.cardUses.map((action) => (
        <CardUseGhost key={action.key} action={action} controller={controller} />
      ))}
    </div>
  );
}

function CardUseGhost({
  action,
  controller,
}: Readonly<{ action: CardUse; controller: GameController }>) {
  const ref = useRef<HTMLDivElement>(null);
  const start = cardMotion(action, 0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const animation = element.animate(cardMotionKeyframes(action), {
      duration: cardMotionDuration,
      fill: 'forwards',
    });
    animation.currentTime = ((controller.state.tick - action.tick) * 1000) / rules.ticksPerSecond;
    const synchronize = () => {
      const elapsed = ((controller.state.tick - action.tick) * 1000) / rules.ticksPerSecond;
      if (elapsed >= cardMotionDuration) {
        animation.currentTime = cardMotionDuration;
        animation.pause();
        return;
      }
      if (!controller.running) {
        animation.currentTime = elapsed;
        animation.pause();
      } else if (animation.playState === 'paused') animation.play();
    };
    synchronize();
    const unsubscribe = controller.subscribe(synchronize);
    return () => {
      animation.cancel();
      unsubscribe();
    };
  }, [action, controller]);
  return (
    <div
      ref={ref}
      className={'hand-card card-use color-' + action.card.performer}
      style={{
        left: start.x / 10.8 + '%',
        top: `calc(${start.y / 19.2}% - env(safe-area-inset-bottom))`,
        transform: `rotate(${start.rotation}deg)`,
      }}
    >
      <HandCardFace card={action.card} cost={action.cost} />
    </div>
  );
}
