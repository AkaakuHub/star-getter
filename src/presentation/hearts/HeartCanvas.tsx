import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameController } from '../../app/gameController';
import { createHeartSprites } from './createSprites';
import { paintHearts } from './paintHearts';

export function HeartCanvas({ controller }: Readonly<{ controller: GameController }>) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d', { alpha: true, desynchronized: true });
    if (!canvas || !context) {
      setError('ハートを描画できません。');
      return;
    }
    let disposed = false;
    let frame = 0;
    let width = 0;
    let height = 0;
    let sprites: Awaited<ReturnType<typeof createHeartSprites>> | null = null;
    const draw = () => {
      frame = 0;
      if (disposed || !sprites) return;
      paintHearts(
        context,
        controller.state,
        controller.state.bloom ? sprites.flower : sprites.heart,
        width,
        height,
      );
      if (controller.running) frame = requestAnimationFrame(draw);
    };
    const synchronize = () => {
      if (!controller.running) {
        cancelAnimationFrame(frame);
        frame = 0;
        draw();
      } else if (!frame && sprites) frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = devicePixelRatio;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      synchronize();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const unsubscribe = controller.subscribe(synchronize);
    resize();
    void createHeartSprites()
      .then((loaded) => {
        if (disposed) return;
        sprites = loaded;
        synchronize();
      })
      .catch((failure: unknown) => {
        if (!disposed)
          setError(failure instanceof Error ? failure.message : 'ハートを描画できません。');
      });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      unsubscribe();
    };
  }, [controller]);
  return (
    <>
      <canvas ref={ref} className="heart-canvas" aria-hidden="true" />
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
    </>
  );
}
