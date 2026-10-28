import { liveCurrentHandCardInstanceIds } from '@akaakuhub/suku-sute-core/runtime/cards/liveHand';
import { expect, test } from 'vite-plus/test';
import { GameDriver } from './driver';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';

test.each([7, 456, 1234])(
  '信号旗で偶数奇数を切り替える編成で1京へ到達する（seed %s）',
  async (seed) => {
    const driver = await GameDriver.create(
      {
        presetId: 'genesis',
        cardDatasIds: ['signal-maker', 'even-rhythm', 'odd-rhythm', 'camera', 'class', 'perennial'],
      },
      seed,
    );
    const cycle = ['even-rhythm', 'signal-maker', 'odd-rhythm', 'pennant'] as const;
    let step = 0;
    let completedCycles = 0;
    while (driver.state.phase === 'playing') {
      if (
        driver.state.deck.length % 2 === 1 &&
        driver.state.hearts.heartLimit === 10000000 &&
        heartCount(driver.state) >= 500000 &&
        liveCurrentHandCardInstanceIds(driver.state).includes('odd-rhythm')
      ) {
        await driver.burst(90 - driver.seconds, 10);
        break;
      }
      const target = cycle[step];
      if (!target) throw new Error('次に使うカードがありません。');
      const used = await driver.useFirst([target, 'class', 'camera', 'perennial']);
      if (used && (used.token ?? used.cardInstanceId) === target) {
        step = (step + 1) % cycle.length;
        if (step === 0) completedCycles++;
      }
      if (used) await driver.burst(0.2, 10);
      await driver.tick();
    }
    driver.report('偶数奇数の操作を完了');
    expect(completedCycles).toBeGreaterThanOrEqual(3);
    expect(driver.peakDeckSize).toBe(7);
    expect(driver.state.genesis.effects).toHaveLength(0);
    expect(driver.state.phase).toBe('finished');
    expect(driver.state.score).toBeGreaterThanOrEqual(10n ** 16n);
  },
);
