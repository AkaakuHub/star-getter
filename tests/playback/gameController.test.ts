import { describe, expect, it } from 'vite-plus/test';
import { GameController } from '../../src/app/gameController';
import type { FrameScheduler, PlaybackClock } from '../../src/app/playbackPorts';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { durationSeconds } from '../../src/domain/game/projection';
import { createGame } from '../../src/domain/game/simulation';

class TestClock implements PlaybackClock {
  seconds = 0;
  interrupted = false;
  muted = false;
  closeCalls = 0;
  pauseBarrier: Promise<void> | null = null;
  resumeBarrier: Promise<void> | null = null;
  async pause(): Promise<void> {
    await this.pauseBarrier;
    this.interrupted = true;
  }
  async resume(): Promise<void> {
    await this.resumeBarrier;
    this.interrupted = false;
  }
  async close(): Promise<void> {
    this.closeCalls++;
  }
  setMuted(value: boolean): void {
    this.muted = value;
  }
}

class TestFrames implements FrameScheduler {
  private next = 1;
  private readonly callbacks = new Map<number, (timestamp: number) => void>();
  get pending(): number {
    return this.callbacks.size;
  }
  request(callback: (timestamp: number) => void): number {
    const handle = this.next++;
    this.callbacks.set(handle, callback);
    return handle;
  }
  cancel(handle: number): void {
    this.callbacks.delete(handle);
  }
  run(timestamp: number): void {
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of callbacks) callback(timestamp);
  }
}

function session() {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  const audio = new TestClock();
  const frames = new TestFrames();
  const controller = new GameController(
    createGame(track, resolveDeck(defaultDeckIds), 7),
    audio,
    frames,
  );
  return { audio, frames, controller };
}

describe('音声時計とゲームの同期', () => {
  it('描画時刻ではなく音声時刻まで進み、入力直前にも同期する', () => {
    const { controller, audio, frames } = session();
    audio.seconds = 2;
    frames.run(999999);
    expect(controller.state.tick).toBe(120);
    audio.seconds = 3;
    controller.command({ type: 'collect' });
    expect(controller.state.tick).toBe(180);
    expect(controller.state.stats.heartsCollected).toBeGreaterThan(0);
  });

  it('音声の停止完了時刻まで進めてから一時停止し、描画も止める', async () => {
    const { controller, audio, frames } = session();
    let completePause: () => void = () => {
      throw new Error('停止の待機がありません。');
    };
    audio.pauseBarrier = new Promise<void>((resolve) => {
      completePause = resolve;
    });
    audio.seconds = 2;
    const pending = controller.togglePause();
    controller.command({ type: 'card', index: 0 });
    expect(controller.state.stats.cardsUsed).toBe(0);
    audio.seconds = 2.3;
    completePause();
    await pending;
    expect(controller.state.phase).toBe('paused');
    expect(controller.state.tick).toBe(138);
    expect(frames.pending).toBe(0);
    frames.run(999999);
    expect(controller.state.tick).toBe(138);
    await controller.togglePause();
    audio.seconds = 2.5;
    frames.run(1000000);
    expect(controller.state.tick).toBe(150);
    expect(frames.pending).toBe(1);
  });

  it('外部から音声が中断された時刻で一時停止する', () => {
    const { controller, audio, frames } = session();
    audio.seconds = 4.25;
    audio.interrupted = true;
    frames.run(4250);
    expect(controller.state.phase).toBe('paused');
    expect(controller.state.tick).toBe(255);
    expect(frames.pending).toBe(0);
  });

  for (const trigger of ['frame', 'input', 'pause'] as const) {
    it(`${trigger}で終了時刻を迎えても音声と描画を一度だけ終了する`, async () => {
      const { controller, audio, frames } = session();
      audio.seconds = durationSeconds(controller.state) + 1;
      if (trigger === 'frame') frames.run(90000);
      if (trigger === 'input') controller.command({ type: 'collect' });
      if (trigger === 'pause') await controller.togglePause();
      expect(controller.state.phase).toBe('finished');
      expect(audio.closeCalls).toBe(1);
      expect(frames.pending).toBe(0);
      await controller.dispose();
      expect(audio.closeCalls).toBe(1);
    });
  }

  it('再開待ちの間に終了しても古い描画を再開しない', async () => {
    const { controller, audio, frames } = session();
    await controller.togglePause();
    let completeResume: () => void = () => {
      throw new Error('再開の待機がありません。');
    };
    audio.resumeBarrier = new Promise<void>((resolve) => {
      completeResume = resolve;
    });
    const pending = controller.togglePause();
    await controller.dispose();
    completeResume();
    await pending;
    expect(frames.pending).toBe(0);
    expect(audio.closeCalls).toBe(1);
    expect(controller.state.phase).toBe('paused');
  });

  it('ミュート操作を音声へ渡し、終了後の入力と通知を止める', async () => {
    const { controller, audio, frames } = session();
    let notifications = 0;
    controller.subscribe(() => {
      notifications++;
    });
    controller.setMuted(true);
    expect(audio.muted).toBe(true);
    await controller.dispose();
    const state = controller.state;
    controller.command({ type: 'card', index: 0 });
    frames.run(5000);
    expect(controller.state).toBe(state);
    expect(notifications).toBe(0);
  });
});
