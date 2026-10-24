import { describe, expect, it, vi } from 'vite-plus/test';
import { GameController } from '../../src/app/gameController';
import type { FrameScheduler, PlaybackClock } from '../../src/app/playbackPorts';
import { defaultDeckIds, resolveDeck } from '../../src/content/cards';
import { tracks } from '../../src/content/tracks';
import { canUseCard, durationSeconds } from '../../src/domain/game/projection';
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

function session(energy = 10) {
  const track = tracks[0];
  if (!track) throw new Error('テスト楽曲がありません。');
  const audio = new TestClock();
  const frames = new TestFrames();
  const controller = new GameController(
    { ...createGame(track, resolveDeck(defaultDeckIds), 7), energy },
    audio,
    frames,
  );
  return { audio, frames, controller };
}

describe('音声時計とゲームの同期', () => {
  it('最初の選択ではAPを使わず、同じカードをもう一度選ぶと発動する', () => {
    const { controller } = session();
    const initial = controller.state;
    const index = initial.hand.findIndex((_, slot) => canUseCard(initial, slot));
    controller.tapCard(index);
    expect(controller.selectedCard?.id).toBe(initial.hand[index]);
    expect(controller.state.energy).toBe(initial.energy);
    expect(controller.state.stats.cardsUsed).toBe(0);
    controller.tapCard(index);
    expect(controller.selectedCard).toBe(null);
    expect(controller.state.stats.cardsUsed).toBe(1);
  });

  it('停止中はカードを確認でき、連続で選んでも発動せず再開後に発動できる', async () => {
    const { controller } = session();
    const index = controller.state.hand.findIndex((_, slot) => canUseCard(controller.state, slot));
    await controller.togglePause();
    controller.tapCard(index);
    controller.tapCard(index);
    expect(controller.selectedCard?.id).toBe(controller.state.hand[index]);
    expect(controller.state.stats.cardsUsed).toBe(0);
    await controller.togglePause();
    controller.activateSelected();
    expect(controller.state.stats.cardsUsed).toBe(1);
  });

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

describe('カード使用可能時の自動停止', () => {
  it('オンにすると使用可能な手札が1枚あれば停止し、停止中のカード使用で再開する', async () => {
    const { controller, audio, frames } = session();
    expect(controller.waitModeEnabled).toBe(false);
    await controller.toggleWaitMode();
    expect(controller.waitModeEnabled).toBe(true);
    expect(controller.waiting).toBe(true);
    expect(controller.running).toBe(false);
    expect(audio.interrupted).toBe(true);
    expect(frames.pending).toBe(0);
    const index = controller.state.hand.findIndex((_, slot) => canUseCard(controller.state, slot));
    controller.tapCard(index);
    controller.tapCard(index);
    expect(controller.state.stats.cardsUsed).toBe(1);
    expect(controller.waiting).toBe(false);
    await vi.waitFor(() => expect(audio.interrupted).toBe(false));
    expect(frames.pending).toBe(1);
  });

  it('使用後は0.35秒待ち、残りの手札が使用可能なら再び停止する', async () => {
    const { controller, audio, frames } = session();
    await controller.toggleWaitMode();
    const index = controller.state.hand.findIndex((_, slot) => canUseCard(controller.state, slot));
    controller.command({ type: 'card', index });
    await vi.waitFor(() => expect(frames.pending).toBe(1));
    audio.seconds = 0.3;
    frames.run(300);
    expect(controller.waiting).toBe(false);
    audio.seconds = 0.35;
    frames.run(350);
    expect(controller.state.hand.some((_, slot) => canUseCard(controller.state, slot))).toBe(true);
    expect(controller.waiting).toBe(true);
    expect(frames.pending).toBe(0);
  });

  it('使用可能なカードがない間は進み、1枚でも使用可能になったら停止する', async () => {
    const { controller, audio, frames } = session(0);
    await controller.toggleWaitMode();
    expect(controller.waiting).toBe(false);
    audio.seconds = 0.1;
    frames.run(100);
    expect(controller.running).toBe(true);
    for (let step = 2; step < 100 && !controller.waiting; step++) {
      audio.seconds = step / 10;
      frames.run(step * 100);
    }
    expect(controller.waiting).toBe(true);
    const usable = controller.state.hand.map((_, slot) => canUseCard(controller.state, slot));
    expect(usable.some(Boolean)).toBe(true);
    expect(usable.every(Boolean)).toBe(false);
  });

  it('使用できないカードを押しても停止を解除せず、音声の停止完了を待って再開する', async () => {
    const { controller, audio, frames } = session(3);
    let completePause: () => void = () => {
      throw new Error('停止の待機がありません。');
    };
    audio.pauseBarrier = new Promise<void>((resolve) => {
      completePause = resolve;
    });
    const toggled = controller.toggleWaitMode();
    expect(controller.waiting).toBe(true);
    const unavailable = controller.state.hand.findIndex(
      (_, slot) => !canUseCard(controller.state, slot),
    );
    expect(unavailable).toBeGreaterThanOrEqual(0);
    controller.command({ type: 'card', index: unavailable });
    expect(controller.waiting).toBe(true);
    expect(controller.state.stats.cardsUsed).toBe(0);
    const available = controller.state.hand.findIndex((_, slot) =>
      canUseCard(controller.state, slot),
    );
    controller.command({ type: 'card', index: available });
    expect(controller.state.stats.cardsUsed).toBe(1);
    expect(frames.pending).toBe(0);
    completePause();
    await toggled;
    await vi.waitFor(() => expect(frames.pending).toBe(1));
    expect(audio.interrupted).toBe(false);
  });

  it('オフにすると停止を解除し、カードが使用可能でも進行する', async () => {
    const { controller, audio, frames } = session();
    await controller.toggleWaitMode();
    await controller.toggleWaitMode();
    expect(controller.waitModeEnabled).toBe(false);
    expect(controller.waiting).toBe(false);
    expect(audio.interrupted).toBe(false);
    audio.seconds = 1;
    frames.run(1000);
    expect(controller.state.tick).toBe(60);
    expect(controller.running).toBe(true);
  });

  it('手札確認などの停止・再開でも自動停止を維持し、確認中はカードを使用しない', async () => {
    const { controller, audio, frames } = session();
    await controller.toggleWaitMode();
    await controller.togglePause();
    controller.command({ type: 'card', index: 0 });
    expect(controller.state.stats.cardsUsed).toBe(0);
    await controller.togglePause();
    expect(controller.waitModeEnabled).toBe(true);
    expect(controller.waiting).toBe(true);
    expect(audio.interrupted).toBe(true);
    expect(frames.pending).toBe(0);
  });
});
