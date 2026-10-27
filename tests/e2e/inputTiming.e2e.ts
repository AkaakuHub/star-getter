import { expect, test } from 'vite-plus/test';
import { canUseCard } from '@akaakuhub/suku-sute-core/game/projection';
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

test('操作時間:使用間隔中に次の手札を確認し、発動時は本体の使用間隔を守る', async () => {
  const driver = await GameDriver.create('library');
  await driver.until(
    (state) => state.hand.some((id, index) => id === 'class' && canUseCard(state, index)),
    () => Promise.resolve(),
  );
  expect((await driver.useFirst(['class']))?.id).toBe('class');
  const first = driver.inputs.findLast((row) => row.input.kind === 'card');
  const count = driver.inputs.length;
  expect((await driver.useFirst(['class']))?.id).toBe('class');
  const secondInputs = driver.inputs.slice(count);
  const inspection = secondInputs.find((row) => row.input.kind === 'card-inspect');
  const activation = secondInputs.find((row) => row.input.kind === 'card');
  if (!first || !inspection || !activation) throw new Error('連続使用の記録がありません。');
  expect(inspection.tick).toBe(first.tick);
  expect(activation.tick - first.tick).toBeGreaterThanOrEqual(activation.before.skillCooldownTicks);
  expect(activation.wallSeconds - inspection.wallSeconds).toBeGreaterThanOrEqual(
    driver.timing.decisionSeconds.minimum + driver.timing.confirmationSeconds.minimum,
  );
});
