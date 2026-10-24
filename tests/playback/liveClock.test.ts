import { expect, it } from 'vite-plus/test';
import { LiveClock } from '../../src/infrastructure/audio/liveClock';

it('音声の許可待ちでも時計を進め、一時停止中の時間を再開時へ加えない', () => {
  let now = 10;
  const clock = new LiveClock(() => now);
  now = 15;
  expect(clock.seconds).toBe(5);
  clock.pause();
  now = 100;
  clock.pause();
  expect(clock.seconds).toBe(5);
  clock.resume();
  clock.resume();
  now = 103;
  expect(clock.seconds).toBe(8);
});
