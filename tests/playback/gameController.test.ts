import { describe, expect, it, vi } from 'vite-plus/test';
import {
  canUseCard,
  cardCooldownTicks,
  durationSeconds,
} from '@akaakuhub/suku-sute-core/game/projection';
import { rules } from '@akaakuhub/suku-sute-core/game/model';
import { session } from './gameSession';

describe('ゲーム時計とゲームの同期', () => {
  it('最初の選択ではエナジーを使わず、同じカードをもう一度選ぶと発動する', () => {
    const { controller } = session();
    const initial = controller.state;
    const index = initial.hand.findIndex((_, slot) => canUseCard(initial, slot));
    controller.tapCard(index);
    expect(controller.selectedCard?.cardInstanceId).toBe(initial.hand[index]);
    expect(controller.state.ap.currentAp).toBe(initial.ap.currentAp);
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
    expect(controller.selectedCard?.cardInstanceId).toBe(controller.state.hand[index]);
    expect(controller.state.stats.cardsUsed).toBe(0);
    await controller.togglePause();
    controller.activateSelected();
    expect(controller.state.stats.cardsUsed).toBe(1);
  });

  it('描画時刻ではなくゲーム時刻まで進み、入力直前にも同期する', () => {
    const { controller, clock, frames } = session();
    clock.seconds = 2;
    frames.run(999999);
    expect(controller.state.tick).toBe(120);
    clock.seconds = 3;
    controller.command({ type: 'collect' });
    expect(controller.state.tick).toBe(180);
    expect(controller.state.stats.heartsCollected).toBeGreaterThan(0);
  });

  it('時計の停止完了時刻まで進めてから一時停止し、描画も止める', async () => {
    const { controller, clock, frames } = session();
    let completePause: () => void = () => {
      throw new Error('停止の待機がありません。');
    };
    clock.pauseBarrier = new Promise<void>((resolve) => {
      completePause = resolve;
    });
    clock.seconds = 2;
    const pending = controller.togglePause();
    controller.command({ type: 'card', index: 0 });
    expect(controller.state.stats.cardsUsed).toBe(0);
    clock.seconds = 2.3;
    completePause();
    await pending;
    expect(controller.state.phase).toBe('paused');
    expect(controller.state.tick).toBe(138);
    expect(frames.pending).toBe(0);
    frames.run(999999);
    expect(controller.state.tick).toBe(138);
    await controller.togglePause();
    clock.seconds = 2.5;
    frames.run(1000000);
    expect(controller.state.tick).toBe(150);
    expect(frames.pending).toBe(1);
  });

  for (const trigger of ['frame', 'input', 'pause'] as const) {
    it(`${trigger}で終了時刻を迎えても時計と描画を一度だけ終了する`, async () => {
      const { controller, clock, frames } = session();
      clock.seconds = durationSeconds(controller.state) + 1;
      if (trigger === 'frame') frames.run(90000);
      if (trigger === 'input') controller.command({ type: 'collect' });
      if (trigger === 'pause') await controller.togglePause();
      expect(controller.state.phase).toBe('finished');
      expect(clock.closeCalls).toBe(1);
      expect(frames.pending).toBe(0);
      await controller.dispose();
      expect(clock.closeCalls).toBe(1);
    });
  }

  it('再開待ちの間に終了しても古い描画を再開しない', async () => {
    const { controller, clock, frames } = session();
    await controller.togglePause();
    let completeResume: () => void = () => {
      throw new Error('再開の待機がありません。');
    };
    clock.resumeBarrier = new Promise<void>((resolve) => {
      completeResume = resolve;
    });
    const pending = controller.togglePause();
    await controller.dispose();
    completeResume();
    await pending;
    expect(frames.pending).toBe(0);
    expect(clock.closeCalls).toBe(1);
    expect(controller.state.phase).toBe('paused');
  });

  it('終了後の入力と通知を止める', async () => {
    const { controller, frames } = session();
    let notifications = 0;
    controller.subscribe(() => {
      notifications++;
    });
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
    const { controller, clock, frames } = session();
    expect(controller.waitModeEnabled).toBe(false);
    await controller.toggleWaitMode();
    expect(controller.waitModeEnabled).toBe(true);
    expect(controller.waiting).toBe(true);
    expect(controller.running).toBe(false);
    expect(clock.paused).toBe(true);
    expect(frames.pending).toBe(0);
    const index = controller.state.hand.findIndex((_, slot) => canUseCard(controller.state, slot));
    controller.tapCard(index);
    controller.tapCard(index);
    expect(controller.state.stats.cardsUsed).toBe(1);
    expect(controller.waiting).toBe(false);
    await vi.waitFor(() => expect(clock.paused).toBe(false));
    expect(frames.pending).toBe(1);
  });

  it('使用後はクールタイムと0.35秒を守り、APが変わらなくても再び停止する', async () => {
    const { controller, clock, frames } = session();
    await controller.toggleWaitMode();
    const index = controller.state.hand.findIndex((_, slot) => canUseCard(controller.state, slot));
    controller.command({ type: 'card', index });
    await vi.waitFor(() => expect(frames.pending).toBe(1));
    clock.seconds = 0.3;
    frames.run(300);
    expect(controller.waiting).toBe(false);
    clock.seconds = 0.35;
    frames.run(350);
    expect(controller.waiting).toBe(false);
    clock.seconds = cardCooldownTicks(controller.state) / rules.ticksPerSecond;
    frames.run(clock.seconds * 1000);
    expect(controller.state.hand.some((_, slot) => canUseCard(controller.state, slot))).toBe(true);
    expect(controller.waiting).toBe(true);
    expect(frames.pending).toBe(0);
  });

  it('使用可能なカードがない間は進み、1枚でも使用可能になったら停止する', async () => {
    const { controller, clock, frames } = session(0);
    await controller.toggleWaitMode();
    expect(controller.waiting).toBe(false);
    clock.seconds = 0.1;
    frames.run(100);
    expect(controller.running).toBe(true);
    for (let step = 2; step < 100 && !controller.waiting; step++) {
      clock.seconds = step / 10;
      frames.run(step * 100);
    }
    expect(controller.waiting).toBe(true);
    const usable = controller.state.hand.map((_, slot) => canUseCard(controller.state, slot));
    expect(usable.some(Boolean)).toBe(true);
    expect(usable.every(Boolean)).toBe(false);
  });

  it('使用できないカードを押しても停止を解除せず、時計の停止完了を待って再開する', async () => {
    const { controller, clock, frames } = session(3);
    let completePause: () => void = () => {
      throw new Error('停止の待機がありません。');
    };
    clock.pauseBarrier = new Promise<void>((resolve) => {
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
    expect(clock.paused).toBe(false);
  });

  it('オフにすると停止を解除し、カードが使用可能でも進行する', async () => {
    const { controller, clock, frames } = session();
    await controller.toggleWaitMode();
    await controller.toggleWaitMode();
    expect(controller.waitModeEnabled).toBe(false);
    expect(controller.waiting).toBe(false);
    expect(clock.paused).toBe(false);
    clock.seconds = 1;
    frames.run(1000);
    expect(controller.state.tick).toBe(60);
    expect(controller.running).toBe(true);
  });

  it('手札確認などの停止・再開でも自動停止を維持し、確認中はカードを使用しない', async () => {
    const { controller, clock, frames } = session();
    await controller.toggleWaitMode();
    await controller.togglePause();
    controller.command({ type: 'card', index: 0 });
    expect(controller.state.stats.cardsUsed).toBe(0);
    await controller.togglePause();
    expect(controller.waitModeEnabled).toBe(true);
    expect(controller.waiting).toBe(true);
    expect(clock.paused).toBe(true);
    expect(frames.pending).toBe(0);
  });
});

describe('カード待ちの解除操作', () => {
  it('共鳴の使用でも待ちを解除する', async () => {
    const { controller, clock, frames } = session(20);
    await controller.toggleWaitMode();
    expect(controller.waiting).toBe(true);
    controller.command({ type: 'special', cardId: 'library-pages' });
    expect(controller.state.stats.specialsUsed).toBe(1);
    expect(controller.waiting).toBe(false);
    await vi.waitFor(() => expect(clock.paused).toBe(false));
    expect(frames.pending).toBe(1);
  });
  it('回収処理だけでは解除せず、待ち解除操作で時計を再開する', async () => {
    const { controller, clock, frames } = session();
    clock.seconds = 1;
    frames.run(1000);
    controller.toggleAutomaticHearts();
    await controller.toggleWaitMode();
    clock.seconds = 2;
    frames.run(2000);
    expect(controller.waiting).toBe(true);
    const before = controller.state.stats.heartsCollected;
    controller.command({ type: 'collect' });
    expect(controller.state.stats.heartsCollected).toBeGreaterThan(before);
    expect(controller.waiting).toBe(true);
    controller.cancelWait();
    await vi.waitFor(() => expect(clock.paused).toBe(false));
    expect(controller.waiting).toBe(false);
    clock.seconds = 2.5;
    frames.run(2500);
    expect(controller.waiting).toBe(false);
  });
});

it('回収領域は待ち中なら解除に使い、次の入力から回収する', async () => {
  const { controller, clock, frames } = session();
  clock.seconds = 1;
  frames.run(1000);
  controller.toggleAutomaticHearts();
  await controller.toggleWaitMode();
  expect(controller.waiting).toBe(true);
  const before = controller.state.stats.heartsCollected;
  expect(controller.collectFromInput()).toBe('wait-cancel');
  expect(controller.state.stats.heartsCollected).toBe(before);
  expect(controller.waiting).toBe(false);
  await vi.waitFor(() => expect(clock.paused).toBe(false));
  expect(controller.collectFromInput()).toBe('collect');
  expect(controller.state.stats.heartsCollected).toBeGreaterThan(before);
});
