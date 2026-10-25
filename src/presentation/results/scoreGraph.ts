import type { ScoreSample } from '../../domain/game/scoreHistory';
import type { MoodSample } from '../../domain/game/moodHistory';

export function projectScoreGraph(
  history: readonly ScoreSample[],
  moodHistory: readonly MoodSample[],
) {
  const maximumTimeSeconds = history.reduce(
    (maximum, sample) => Math.max(maximum, Math.trunc(sample.timeMilliseconds / 1000)),
    0,
  );
  const maximumScore = history.reduce(
    (maximum, sample) => (sample.totalScore > maximum ? sample.totalScore : maximum),
    0n,
  );
  return {
    maximumTimeSeconds,
    maximumScore,
    moodPoints: moodHistory.map((sample) => ({
      x:
        maximumTimeSeconds === 0
          ? 0
          : Math.trunc(sample.timeMilliseconds / 1000) / maximumTimeSeconds,
      y: (sample.moodValue + 100) / 200,
    })),
    points: history.map((sample) => ({
      x:
        maximumTimeSeconds === 0
          ? 0
          : Math.trunc(sample.timeMilliseconds / 1000) / maximumTimeSeconds,
      y:
        maximumScore === 0n
          ? 0
          : Number((sample.totalScore * 1_000_000n) / maximumScore) / 1_000_000,
    })),
  };
}
