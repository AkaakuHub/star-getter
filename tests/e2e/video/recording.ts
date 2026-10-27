import { readFile } from 'node:fs/promises';
import type { VideoRecording } from './types.ts';

export async function readRecording(path: string): Promise<VideoRecording> {
  const value: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (
    !value ||
    typeof value !== 'object' ||
    !('route' in value) ||
    (value.route !== 'library' && value.route !== 'bloom') ||
    !('seed' in value) ||
    !Number.isSafeInteger(value.seed) ||
    !('ticksPerSecond' in value) ||
    value.ticksPerSecond !== 60 ||
    !('inputs' in value) ||
    !Array.isArray(value.inputs) ||
    !('finalState' in value) ||
    !value.finalState ||
    typeof value.finalState !== 'object'
  )
    throw new Error('E2Eの操作記録を指定してください。');
  const final = value.finalState;
  if (
    !('score' in final) ||
    typeof final.score !== 'string' ||
    !('wallSeconds' in final) ||
    typeof final.wallSeconds !== 'number' ||
    !Number.isFinite(final.wallSeconds) ||
    final.wallSeconds <= 0 ||
    !('phase' in final) ||
    final.phase !== 'finished'
  )
    throw new Error('最後まで完了したE2Eの操作記録を指定してください。');
  return value as VideoRecording;
}
