import { chromium } from 'playwright-core';
import { createServer } from 'vite-plus';
import { mkdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { readRecording } from './recording.ts';
import { renderVideo } from './render.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { fps: { type: 'string', default: '15' }, 'preview-seconds': { type: 'string' } },
});
if (!positionals.length) throw new Error('使い方: pnpm e2e:video <recording.json>...');
const fps = Number(values.fps);
if (!Number.isSafeInteger(fps) || fps < 1 || fps > 60 || 60 % fps !== 0)
  throw new Error('fpsには60の約数を指定してください。');
const preview =
  values['preview-seconds'] === undefined ? undefined : Number(values['preview-seconds']);
if (preview !== undefined && (!Number.isFinite(preview) || preview <= 0))
  throw new Error('プレビュー時間には正の秒数を指定してください。');
const outputDirectory = resolve(
  'artifacts/e2e/videos',
  new Date().toISOString().replaceAll(/[:.]/g, '-'),
);
await mkdir(outputDirectory, { recursive: true });
const server = await createServer({
  configFile: resolve('vite.config.ts'),
  logLevel: 'warn',
  server: { host: '127.0.0.1', port: 0, strictPort: true, hmr: false, watch: null },
});
try {
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('録画用サーバーのURLを取得できません。');
  const browser = await chromium.launch({
    args: ['--enable-begin-frame-control', '--run-all-compositor-stages-before-draw'],
  });
  try {
    for (const path of positionals) {
      const recording = await readRecording(path);
      await renderVideo(
        browser,
        url,
        recording,
        resolve(outputDirectory, basename(path, '.json') + '.mp4'),
        fps,
        preview,
      );
    }
  } finally {
    await browser.close();
  }
} finally {
  await server.close();
}
