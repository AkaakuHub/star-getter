import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GameRecording, InputRecord } from './gameRecording';
import { routes } from '../../../src/content/routes';
import { rules } from '../../../src/domain/game/model';

function describe(record: InputRecord): string {
  const input = record.input;
  if (input.kind === 'collect') return 'スターを回収';
  if (input.kind === 'automatic-hearts') return '自動回収を' + (input.enabled ? 'ON' : 'OFF');
  const position =
    input.card.handIndex === null ? '' : '・手札' + (input.card.handIndex + 1) + '枚目';
  return (
    (input.kind === 'special' ? '共鳴' : 'カード') +
    '「' +
    input.card.name +
    '」' +
    position +
    '（' +
    input.card.instanceId +
    '）'
  );
}

function markdown(label: string, recording: GameRecording): string {
  const rows = [
    '# ' + label,
    '',
    '編成:' + routes[recording.route].name + ' / seed:' + recording.seed,
    '',
    '|秒|tick|操作|スター前→後|専用値前→後|デッキ前→後|',
    '|---:|---:|---|---:|---:|---:|',
  ];
  for (let index = 0; index < recording.inputs.length; index++) {
    const first = recording.inputs[index];
    if (!first) continue;
    let last = first;
    let count = 1;
    if (first.input.kind === 'collect') {
      while (recording.inputs[index + 1]?.input.kind === 'collect') {
        const next = recording.inputs[++index];
        if (!next) break;
        last = next;
        count++;
      }
    }
    const elapsed = last.seconds - first.seconds;
    const operation =
      count === 1
        ? describe(first)
        : 'スターを' +
          count +
          '回回収（' +
          (elapsed === 0 ? '同じtick' : ((count - 1) / elapsed).toFixed(2) + '回/秒') +
          '）';
    rows.push(
      '|' +
        first.seconds.toFixed(3) +
        (elapsed === 0 ? '' : '〜' + last.seconds.toFixed(3)) +
        '|' +
        first.tick +
        '|' +
        operation +
        '|' +
        first.before.score +
        '→' +
        last.after.score +
        '|' +
        (first.before.gauge ?? '—') +
        '→' +
        (last.after.gauge ?? '—') +
        '|' +
        first.before.deckSize +
        '→' +
        last.after.deckSize +
        '|',
    );
  }
  rows.push(
    '',
    '最終状態:' +
      recording.finalState.seconds.toFixed(3) +
      '秒 / ' +
      recording.finalState.score +
      'スター / ' +
      recording.finalState.phase,
  );
  return rows.join('\n') + '\n';
}

export function writeRecordings(label: string, recordings: readonly GameRecording[]): void {
  const directory = join(process.cwd(), 'artifacts', 'e2e');
  mkdirSync(directory, { recursive: true });
  const digest = createHash('sha256').update(label).digest('hex').slice(0, 10);
  const readable = Array.from(new Intl.Segmenter('ja').segment(label), ({ segment }) => segment)
    .slice(0, 24)
    .join('')
    .replace(/[^\p{Letter}\p{Number}-]/gu, '-');
  const prefixes = new Set(
    recordings.map(
      (recording) => recording.route + '-seed-' + recording.seed + '-' + digest + '-' + readable,
    ),
  );
  for (const file of readdirSync(directory))
    if ([...prefixes].some((prefix) => file.startsWith(prefix + '-')))
      unlinkSync(join(directory, file));
  recordings.forEach((recording, index) => {
    const file =
      recording.route +
      '-seed-' +
      recording.seed +
      '-' +
      digest +
      '-' +
      readable +
      '-' +
      (index + 1);
    writeFileSync(
      join(directory, file + '.json'),
      JSON.stringify(
        {
          test: label,
          route: recording.route,
          seed: recording.seed,
          ticksPerSecond: rules.ticksPerSecond,
          finalState: recording.finalState,
          inputs: recording.inputs,
        },
        null,
        2,
      ) + '\n',
    );
    writeFileSync(join(directory, file + '.md'), markdown(label, recording));
  });
}
