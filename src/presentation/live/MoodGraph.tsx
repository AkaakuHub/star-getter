import { useEffect, useRef } from 'preact/hooks';
import { type GameState, rules } from '../../domain/game/model';
import { durationSeconds, sectionAt } from '../../domain/game/projection';
import { liveLayout } from './layout';
import { paintMoodGraph } from './paintMoodGraph';

export function MoodGraph({ state }: Readonly<{ state: GameState }>) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { track } = state;
  const mood = sectionAt(state).moodValue;
  const progress = Math.min(1, state.tick / rules.ticksPerSecond / durationSeconds(state));
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const draw = () => {
      canvas.width = Math.round(canvas.clientWidth * devicePixelRatio);
      canvas.height = Math.round(canvas.clientHeight * devicePixelRatio);
      context.setTransform(canvas.width / 750, 0, 0, canvas.height / 170, 0, 0);
      paintMoodGraph(context, track);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [track]);
  return (
    <div className="live-analyzer" style={liveLayout.analyzer}>
      <strong className="mood-value">
        MOOD {mood > 0 ? '+' : ''}
        {mood}
      </strong>
      <div className="mood-graph" role="img" aria-label={'ムードグラフ、現在' + mood}>
        <canvas ref={ref} aria-hidden="true" />
        <i className="mood-position" style={{ left: progress * 100 + '%' }} />
      </div>
      <span className="mood-start">START</span>
      <span className="mood-goal">GOAL</span>
    </div>
  );
}
