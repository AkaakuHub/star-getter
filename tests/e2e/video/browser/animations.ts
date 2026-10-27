export function createAnimationClock(
  gameMilliseconds: () => number,
  wallMilliseconds: () => number,
) {
  const clocks = new WeakMap<Animation, Readonly<{ origin: number; game: boolean }>>();
  return () => {
    for (const animation of document.getAnimations()) {
      let clock = clocks.get(animation);
      if (!clock) {
        const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
        const game = target instanceof Element && target.closest('.card-use-layer') !== null;
        const current =
          game && typeof animation.currentTime === 'number' ? animation.currentTime : 0;
        clock = { origin: (game ? gameMilliseconds() : wallMilliseconds()) - current, game };
        clocks.set(animation, clock);
      }
      animation.pause();
      animation.currentTime = (clock.game ? gameMilliseconds() : wallMilliseconds()) - clock.origin;
    }
  };
}
