import { readFile } from 'node:fs/promises';
import type { VideoRecording } from './types.ts';

export async function readRecording(path: string): Promise<VideoRecording> {
  const value: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (
    !value ||
    typeof value !== 'object' ||
    !('route' in value) ||
    (value.route !== 'library' && value.route !== 'genesis') ||
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
    !('setup' in value) ||
    !value.setup ||
    typeof value.setup !== 'object' ||
    !('presetId' in value.setup) ||
    value.setup.presetId !== value.route ||
    !('cardDatasIds' in value.setup) ||
    !Array.isArray(value.setup.cardDatasIds) ||
    value.setup.cardDatasIds.length < 3 ||
    value.setup.cardDatasIds.length > 100 ||
    new Set(value.setup.cardDatasIds).size !== value.setup.cardDatasIds.length ||
    !value.setup.cardDatasIds.every(
      (id: unknown): id is string =>
        typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id),
    )
  )
    throw new Error('操作記録の編成が正しくありません。');
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
