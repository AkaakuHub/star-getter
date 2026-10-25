import { expect, test } from 'vite-plus/test';
import { canUseCard } from '../../src/domain/game/projection';
import { GameDriver } from './driver';

for (const waitMode of [false, true]) {
  test(`操作時間:自動停止${waitMode ? 'ON' : 'OFF'}でも判断と選択後の時間を使う`, async () => {
    const driver = await GameDriver.create('library');
    await driver.until(
      (state) => state.hand.some((id, index) => id === 'class' && canUseCard(state, index)),
      () => Promise.resolve(),
    );
    await driver.setWaitMode(waitMode);
    expect((await driver.useFirst(['class']))?.id).toBe('class');
    expect(await driver.special('library-pages')).toBe(true);
    const inspection = driver.inputs.find((row) => row.input.kind === 'card-inspect');
    const selection = driver.inputs.find((row) => row.input.kind === 'card-select');
    const activation = driver.inputs.find((row) => row.input.kind === 'card');
    if (!inspection || !selection || !activation) throw new Error('カード操作の記録がありません。');
    const decisionTime = selection.wallSeconds - inspection.wallSeconds;
    expect(decisionTime).toBeGreaterThanOrEqual(driver.timing.decisionSeconds.minimum);
    expect(decisionTime).toBeLessThanOrEqual(driver.timing.decisionSeconds.maximum + 1 / 60);
    expect(activation.wallSeconds - selection.wallSeconds).toBeGreaterThanOrEqual(
      driver.timing.confirmationSeconds.minimum,
    );
    expect(activation.wallSeconds).toBeGreaterThan(inspection.wallSeconds);
    await driver.setWaitMode(false);
  });
}
