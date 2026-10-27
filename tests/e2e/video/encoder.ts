import { spawn } from 'node:child_process';
import { once } from 'node:events';

export function createEncoder(output: string, fps: number) {
  const process = spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'image2pipe',
      '-framerate',
      String(fps),
      '-i',
      'pipe:0',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '25',
      '-maxrate',
      '230k',
      '-bufsize',
      '460k',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      output,
    ],
    { stdio: ['pipe', 'ignore', 'inherit'] },
  );
  const completion = new Promise<number | Error | null>((resolve) => {
    process.once('error', resolve);
    process.stdin.once('error', resolve);
    process.once('exit', resolve);
  });
  return {
    async write(frame: Uint8Array): Promise<void> {
      if (!process.stdin.write(frame)) await once(process.stdin, 'drain');
    },
    async finish(): Promise<void> {
      process.stdin.end();
      const result = await completion;
      if (result instanceof Error) throw result;
      if (result !== 0) throw new Error('動画のエンコードに失敗しました: ' + result);
    },
    close(): void {
      if (!process.stdin.destroyed) process.stdin.end();
      if (process.exitCode === null) process.kill();
    },
  };
}
