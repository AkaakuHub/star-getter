import { useEffect, useRef } from 'preact/hooks';
import type { GameState } from '../../domain/game/model';
import { paintResultGraph } from './paintResultGraph';

export function ResultGraph({ state }: Readonly<{ state: GameState }>) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      paintResultGraph(context, state, width, height);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [state]);
  return <canvas ref={ref} className="result-graph" role="img" aria-label="スターと空模様の推移" />;
}
