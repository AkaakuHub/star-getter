import { describe, expect, it, vi } from 'vite-plus/test';
import { session } from './gameSession';

describe('ゲーム進行と効果音', () => {
  it('自然出現の生成回数を表示数に依存せず音へ渡す', () => {
    const { controller, clock, frames, audio } = session();
    controller.setHeartShowLimit(10);
    clock.seconds = 2;
    frames.run(2000);
    expect(controller.state.hearts.generationCount).toBeGreaterThan(0);
    expect(audio.sounds.filter((sound) => sound === 'heart-spawn')).toHaveLength(
      controller.state.hearts.generationCount,
    );
  });

  it('回収直後には鳴らず表示ハートの到着時にだけ回収音を渡す', () => {
    const { controller, clock, frames, audio } = session();
    clock.seconds = 1.5;
    frames.run(1500);
    const shown = controller.state.hearts.stageHearts.filter(
      (heart) => heart.showState === 'show',
    ).length;
    expect(shown).toBeGreaterThan(0);
    controller.command({ type: 'collect' });
    expect(audio.sounds.filter((sound) => sound === 'heart-collect')).toHaveLength(0);
    clock.seconds = 2;
    frames.run(2000);
    expect(audio.sounds.filter((sound) => sound === 'heart-collect')).toHaveLength(0);
    clock.seconds = 2.7;
    frames.run(2700);
    expect(audio.sounds.filter((sound) => sound === 'heart-collect')).toHaveLength(shown);
  });

  it('音声の許可待ちでもゲーム時計と入力を進める', async () => {
    const { controller, clock, frames, audio } = session();
    let unlock: () => void = () => undefined;
    audio.unlockBarrier = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    controller.unlockAudio();
    expect(audio.unlockCalls).toBe(1);
    clock.seconds = 2;
    frames.run(2000);
    controller.command({ type: 'collect' });
    expect(controller.state.tick).toBe(120);
    expect(controller.state.stats.heartsCollected).toBeGreaterThan(0);
    unlock();
    await controller.dispose();
  });

  it('音の失敗を通知してもゲームの進行を止めない', async () => {
    const { controller, clock, frames, audio } = session();
    audio.unlockBarrier = Promise.reject(new Error('音声を開始できません。'));
    controller.unlockAudio();
    await vi.waitFor(() => expect(controller.error).toBe('音声を開始できません。'));
    clock.seconds = 1;
    frames.run(1000);
    expect(controller.state.tick).toBe(60);
    expect(controller.running).toBe(true);
  });

  it('ミュートを音だけへ反映し、終了時は時計と音を1回ずつ破棄する', async () => {
    const { controller, clock, frames, audio } = session();
    controller.setMuted(true);
    expect(audio.muted).toBe(true);
    clock.seconds = 1;
    frames.run(1000);
    expect(controller.state.tick).toBe(60);
    controller.setMuted(false);
    expect(audio.muted).toBe(false);
    expect(audio.unlockCalls).toBe(1);
    await controller.dispose();
    await controller.dispose();
    expect(audio.closeCalls).toBe(1);
    expect(clock.closeCalls).toBe(1);
  });
});
