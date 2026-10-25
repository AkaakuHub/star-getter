import { expect, it } from 'vite-plus/test';
import { LiveClock } from '../../src/infrastructure/playback/liveClock';

it('一時停止中の時間を再開時へ加えない', async () => {
  let now = 10;
  const clock = new LiveClock(() => now);
  now = 15;
  expect(clock.seconds).toBe(5);
  await clock.pause();
  now = 100;
  await clock.pause();
  expect(clock.seconds).toBe(5);
  await clock.resume();
  await clock.resume();
  now = 103;
  expect(clock.seconds).toBe(8);
});

it('終了後は再開されず、その時刻を保持する', async () => {
  let now = 0;
  const clock = new LiveClock(() => now);
  now = 60;
  const closing = clock.close();
  await clock.resume();
  await closing;
  now = 100;
  expect(clock.seconds).toBe(60);
});
