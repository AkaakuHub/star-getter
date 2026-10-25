import { expect } from 'vite-plus/test';
import type { GameRecording, InputRecord } from '../recording/gameRecording';

export function assertInputTiming(recording: GameRecording): void {
  let previousPointer: InputRecord | undefined;
  const selections = new Map<string, InputRecord>();
  const menus = new Map<string, InputRecord>();
  for (const row of recording.inputs) {
    const input = row.input;
    if (input.kind === 'card-inspect' || input.kind === 'card-cancel') continue;
    if (previousPointer)
      expect(row.wallSeconds - previousPointer.wallSeconds + 1e-9).toBeGreaterThanOrEqual(
        recording.timing.pointerIntervalSeconds.minimum,
      );
    previousPointer = row;
    if (input.kind === 'card-select') selections.set(input.card.instanceId, row);
    if (input.kind === 'special-menu') menus.set(input.card.instanceId, row);
    if (input.kind === 'card') {
      expect(row.tick - row.before.lastActionTick).toBeGreaterThanOrEqual(
        row.before.skillCooldownTicks,
      );
      const selection = selections.get(input.card.instanceId);
      if (!selection) throw new Error('選択前にカードを発動しています。');
      expect(row.wallSeconds - selection.wallSeconds + 1e-9).toBeGreaterThanOrEqual(
        recording.timing.confirmationSeconds.minimum,
      );
    }
    if (input.kind === 'special') {
      const menu = menus.get(input.card.instanceId);
      if (!menu) throw new Error('一覧を開く前に共鳴を発動しています。');
      expect(row.wallSeconds - menu.wallSeconds + 1e-9).toBeGreaterThanOrEqual(
        recording.timing.specialMenuSeconds.minimum + recording.timing.confirmationSeconds.minimum,
      );
      expect(menu.after.phase).toBe('paused');
      expect(row.seconds).toBe(menu.seconds);
    }
  }
}
