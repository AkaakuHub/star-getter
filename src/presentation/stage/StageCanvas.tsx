import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameController } from '../../app/gameController';
import type { StageRenderer } from './stageRenderer';

export function StageCanvas({ controller }: Readonly<{ controller: GameController }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('ステージを準備中');
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let renderer: StageRenderer | null = null;
    let frame = 0;
    let previous = -Infinity;
    let observer: ResizeObserver | null = null;
    let unsubscribe: (() => void) | null = null;
    const draw = (timestamp: number) => {
      frame = 0;
      if (cancelled || !renderer) return;
      if (timestamp - previous >= 1000 / 30) {
        renderer.render(controller.state);
        previous = timestamp;
      }
      if (controller.state.phase === 'playing') frame = requestAnimationFrame(draw);
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      cancelled = true;
      setStatus('3Dの描画が停止しました。表示を切り替えて再度お試しください。');
    };
    canvas.addEventListener('webglcontextlost', contextLost);
    void import('./stageRenderer')
      .then(({ StageRenderer: Renderer }) => {
        if (cancelled) return;
        renderer = new Renderer(canvas);
        renderer.render(controller.state);
        setStatus('');
        observer = new ResizeObserver(() => {
          renderer?.resize();
          renderer?.render(controller.state);
        });
        observer.observe(canvas);
        unsubscribe = controller.subscribe(() => {
          if (cancelled) return;
          if (controller.state.phase === 'playing' && !frame) frame = requestAnimationFrame(draw);
          if (controller.state.phase !== 'playing') {
            cancelAnimationFrame(frame);
            frame = 0;
            renderer?.render(controller.state);
          }
        });
        frame = requestAnimationFrame(draw);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setStatus(
            error instanceof Error
              ? `3Dを表示できません: ${error.message}`
              : '3Dを表示できません。',
          );
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      canvas.removeEventListener('webglcontextlost', contextLost);
      unsubscribe?.();
      observer?.disconnect();
      renderer?.dispose();
    };
  }, [controller]);
  return (
    <>
      <canvas ref={canvasRef} className="stage-canvas" aria-hidden="true" />
      {status && (
        <p role="status" className="stage-status">
          {status}
        </p>
      )}
    </>
  );
}
