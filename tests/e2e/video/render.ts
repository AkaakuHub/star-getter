import type { Browser } from 'playwright-core';
import { writeFile } from 'node:fs/promises';
import { installTapOverlay } from './browser/taps.ts';
import { createEncoder } from './encoder.ts';
import { paint, replayInput, snapshot, verifyInput } from './replay.ts';
import type { TapRecord, VideoRecording } from './types.ts';

export async function renderVideo(
  browser: Browser,
  url: string,
  recording: VideoRecording,
  output: string,
  fps: number,
  previewSeconds: number | undefined,
): Promise<Readonly<{ generationSeconds: number; durationSeconds: number; speedup: number }>> {
  const started = performance.now();
  const duration =
    previewSeconds === undefined ? recording.finalState.wallSeconds + 2 : previewSeconds;
  const context = await browser.newContext({
    viewport: { width: 480, height: 854 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(
    (config) => {
      window.e2eVideoConfig = config;
    },
    { route: recording.route, seed: recording.seed },
  );
  await page.addInitScript(installTapOverlay);
  await page.route('**/src/app/createGameController.ts', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: "export { createGameController } from '/tests/e2e/video/browser/controller.ts';",
    }),
  );
  const epoch = new Date('2026-01-01T00:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.goto(url + '?route=' + (recording.route === 'library' ? 'unabara' : 'kaika'));
  const start = await page
    .getByRole('button', { name: 'はじめる', exact: true })
    .evaluate((element) => {
      element.scrollIntoView({ block: 'center', behavior: 'instant' });
      const bounds = element.getBoundingClientRect();
      window.e2eVideoTapLabel = '開始';
      return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    });
  await page.mouse.click(start.x, start.y);
  await page.waitForFunction(() => window.e2eVideoSession !== undefined);
  await page.clock.runFor(32);
  await page.evaluate(() => document.fonts.ready);
  const capture = await context.newCDPSession(page);
  await capture.send('Performance.enable');
  const metrics = await capture.send('Performance.getMetrics');
  const origin = metrics.metrics.find((metric) => metric.name === 'Timestamp');
  if (!origin) throw new Error('描画用の時計を取得できません。');
  const originMilliseconds = origin.value * 1000;
  let captureIndex = 0;
  const encoder = createEncoder(output, fps);
  const taps: TapRecord[] = [];
  let wallTick = 0;
  let visualMilliseconds = 0;
  let inputIndex = 0;

  async function captureFrame(format: 'jpeg' | 'png'): Promise<Buffer> {
    const frame = await capture.send('HeadlessExperimental.beginFrame', {
      frameTimeTicks: originMilliseconds + (captureIndex++ * 1000) / fps,
      interval: 1000 / fps,
      screenshot: { format, quality: 85, optimizeForSpeed: true },
    });
    if (!frame.screenshotData) throw new Error('動画のフレームを取得できません。');
    return Buffer.from(frame.screenshotData, 'base64');
  }

  async function advance(target: number): Promise<void> {
    if (target < wallTick) throw new Error('録画の時刻が逆転しています。');
    await page.evaluate(async (tick) => {
      const session = window.e2eVideoSession;
      if (!session) throw new Error('録画用の時計がありません。');
      await session.advanceTo(tick);
    }, target);
    const milliseconds = Math.round((target * 1000) / 60);
    await page.clock.runFor(milliseconds - visualMilliseconds);
    visualMilliseconds = milliseconds;
    wallTick = target;
  }

  try {
    const frameCount = Math.ceil(duration * fps);
    for (let frame = 0; frame < frameCount; frame++) {
      const target = (frame * 60) / fps;
      while (inputIndex < recording.inputs.length) {
        const row = recording.inputs[inputIndex];
        if (!row) throw new Error('操作記録が欠落しています。');
        const at = Math.round(row.wallSeconds * 60);
        if (at > target) break;
        await advance(at);
        const tap = await replayInput(page, row);
        if (tap) taps.push(tap);
        await verifyInput(page, row);
        await paint(page);
        inputIndex++;
      }
      await advance(target);
      await paint(page);
      await encoder.write(await captureFrame('jpeg'));
      if (frame % (fps * 10) === 0)
        console.log(
          JSON.stringify({
            output,
            seconds: frame / fps,
            duration,
            inputs: inputIndex,
            taps: taps.length,
          }),
        );
    }
    const final = await snapshot(page);
    if (
      previewSeconds === undefined &&
      (final.score !== recording.finalState.score || final.phase !== 'finished')
    )
      throw new Error('最終結果が操作記録と一致しません。');
    if (errors.length) throw new Error(errors.join('\n'));
    await encoder.finish();
    const generationSeconds = (performance.now() - started) / 1000;
    const timing = {
      generationSeconds,
      durationSeconds: frameCount / fps,
      speedup: frameCount / fps / generationSeconds,
    };
    await writeFile(output + '.png', await captureFrame('png'));
    await writeFile(
      output + '.json',
      JSON.stringify({ ...timing, fps, inputs: inputIndex, final, taps }, null, 2) + '\n',
    );
    console.log(JSON.stringify({ completed: output, score: final.score, ...timing }));
    return timing;
  } finally {
    encoder.close();
    await context.close();
  }
}
