import { expect, test } from 'vite-plus/test';
import { durationSeconds, moodValue } from '@akaakuhub/suku-sute-core/game/projection';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import { rules } from '@akaakuhub/suku-sute-core/game/model';
import { GameDriver } from './driver';

const priority = [
  'shadow',
  'frost-pulse',
  'frost-echo',
  'rain-preparation',
  'aurora-ensemble',
  'class',
  'horizon',
  'perennial',
  'camera',
  'library-ensemble',
];

async function activate(driver: GameDriver): Promise<number> {
  await driver.setWaitMode(true);
  await driver.until(
    (state) => state.bloom !== null,
    async () => {
      await driver.special('library-ensemble');
      if (await driver.special('horizon')) {
        return;
      }
      await driver.useFirst(['class', 'camera', 'horizon', 'perennial']);
      driver.collect();
    },
  );
  driver.report('共鳴を先に発動');
  const activation = driver.inputs.find(
    (row) => row.input.kind === 'special' && row.input.card.instanceId === 'horizon',
  );
  if (!activation) throw new Error('開花の発動記録がありません。');
  return activation.before.currentAp - 20;
}

async function prepare(driver: GameDriver, stableCollection = true): Promise<void> {
  await driver.setWaitMode(true);
  const target = (rules.maxBloomGauge * 99n) / 100n;
  while (
    driver.seconds < durationSeconds(driver.state) - 2 &&
    (driver.state.bloom?.progress ?? 0n) < target
  ) {
    const shadowUses = driver.state.cardUseCounts['shadow-1'] ?? 0;
    if (!driver.state.automaticHeart.enabled) await driver.toggleAutomaticHearts();
    const progress = driver.state.bloom?.progress ?? 0n;
    if (!stableCollection && progress >= 2_050_000_000n) {
      const used = await driver.useFirst(
        progress >= 2_120_000_000n
          ? ['horizon', 'sunrise', 'rain-preparation', 'frost-echo']
          : ['frost-echo', 'horizon', 'sunrise', 'rain-preparation'],
      );
      if (used)
        console.log(
          JSON.stringify({
            stage: '上限付近の調整',
            seconds: driver.seconds,
            card: used.id,
            before: progress.toString(),
            after: driver.state.bloom?.progress.toString(),
          }),
        );
      await driver.tick();
      continue;
    }
    const created = driver.state.deck.some((card) => card.token === 'shadow');
    const next =
      !created && shadowUses === 0
        ? ['frost-echo', ...priority]
        : moodValue(driver.state) > -100
          ? ['rain-preparation', 'frost-echo', ...priority]
          : shadowUses < 14
            ? driver.state.hand.some((id) => id.startsWith('shadow-'))
              ? ['shadow', 'frost-echo', 'sunrise', 'rain-preparation']
              : ['frost-echo', 'sunrise', 'rain-preparation', 'aurora-ensemble']
            : !stableCollection && (driver.state.bloom?.strength ?? 0) >= 100
              ? ['library-ensemble', 'aurora-ensemble', ...priority]
              : driver.seconds >= 60
                ? ['camera', ...priority]
                : priority;
    const beforeRedraw = driver.collectionRedraws;
    if (
      stableCollection &&
      shadowUses >= 14 &&
      moodValue(driver.state) <= -100 &&
      heartCount(driver.state) >= 500_000
    ) {
      driver.collect();
      if (driver.collectionRedraws > beforeRedraw && heartCount(driver.state) >= 500_000) {
        const redraws = driver.collectionRedraws;
        const collections = driver.collections;
        await driver.burst(2, 10);
        const attempts = driver.collections - collections;
        if (
          attempts >= 10 &&
          driver.collectionRedraws - redraws === attempts &&
          heartCount(driver.state) >= 500_000
        )
          return;
      }
    }
    await driver.useFirst(
      shadowUses >= 14 && moodValue(driver.state) <= -100 && heartCount(driver.state) < 500_000
        ? driver.cardActions % 3 === 0
          ? ['sunrise', 'frost-pulse', ...next]
          : ['frost-pulse', 'sunrise', ...next]
        : next,
    );
    if (!driver.state.specialUsed.includes('library-ensemble'))
      await driver.special('library-ensemble');
    if (driver.seconds >= (stableCollection ? 75 : 80)) await driver.special('horizon');
    if (
      (stableCollection || (driver.state.bloom?.progress ?? 0n) < 2_050_000_000n) &&
      driver.inputTick % 6 === 0
    )
      driver.collect();
    await driver.tick();
  }
}

test('開花:共鳴→追加カード→雨→除外→引き直しで専用値を育てて手動回収する', async () => {
  const driver = await GameDriver.create('bloom');
  driver.report('開始');
  const paidEnergy = await activate(driver);
  expect(driver.state.cardUseCounts['frost-echo'] ?? 0).toBe(0);
  expect(driver.state.cardUseCounts['rain-preparation'] ?? 0).toBe(0);
  expect(driver.state.bloom?.rollback.currentAp).toBe(paidEnergy);
  const initialGauge = driver.state.bloom?.progress ?? 0n;
  const ordinary = [
    driver.state.currentAp,
    driver.state.currentMental,
    driver.state.currentVoltage,
  ];
  const earlyBefore = driver.state.score;
  await driver.burst(2, 10);
  const earlyGain = driver.state.score - earlyBefore;
  await prepare(driver);
  driver.report('専用値を準備');
  console.log(
    JSON.stringify({
      hand: driver.state.hand,
      beat: driver.state.sectionBeatHeartBonus,
      boosts: driver.state.targetBoosts.length,
      mentalProtected: driver.state.mentalProtected,
      sectionProtected: driver.state.sectionMentalProtected,
    }),
  );
  expect(driver.peakGauge).toBeGreaterThan(initialGauge);
  expect([driver.state.currentAp, driver.state.currentMental, driver.state.currentVoltage]).toEqual(
    ordinary,
  );
  expect(driver.state.cardUseCounts['shadow-1']).toBeGreaterThanOrEqual(14);
  const measurementTick = driver.state.tick;
  const before = driver.state.score;
  await driver.burst(2, 10);
  const preparedGain = driver.state.score - before;
  driver.report('連打2秒');
  const plain = await GameDriver.create('bloom');
  await plain.burst(measurementTick / rules.ticksPerSecond, 10);
  const plainBefore = plain.state.score;
  await plain.burst(2, 10);
  const plainGain = plain.state.score - plainBefore;
  await plain.burst(durationSeconds(plain.state) - plain.seconds, 10);
  plain.report('カード未使用全区間');
  while (driver.state.phase === 'playing') {
    if (moodValue(driver.state) > -100) await driver.useFirst(['rain-preparation', 'sunrise']);
    if (driver.inputTick % 4 === 0) driver.collect();
    await driver.tick();
  }
  driver.report('15回毎秒で全区間終了');
  const omitted = await GameDriver.create('bloom');
  await omitted.finishWithCards(priority);
  omitted.report('順序を省略した連打');
  console.log(
    JSON.stringify({
      route: 'bloom',
      earlyGain: earlyGain.toString(),
      preparedGain: preparedGain.toString(),
      plainGain: plainGain.toString(),
      peakGauge: driver.peakGauge.toString(),
      target: ((rules.maxBloomGauge * 99n) / 100n).toString(),
    }),
  );
  expect(plain.state.score).toBeLessThan(100_000_000n);
  expect(preparedGain).toBeGreaterThan(earlyGain);
  expect(preparedGain).toBeGreaterThan(plainGain);
  expect(driver.state.score).toBeGreaterThan(omitted.state.score);
  expect.soft(driver.state.score).toBeGreaterThan(10n ** 16n);
});

test('開花:カード準備を専用値上限の直前まで継続する', async () => {
  const driver = await GameDriver.create('bloom');
  await activate(driver);
  await driver.burst(2, 10);
  await prepare(driver, false);
  driver.report('専用値目標までカード準備を継続');
  await driver.burst(durationSeconds(driver.state) - driver.seconds, 15);
  driver.report('専用値準備後の15回毎秒で全区間終了');
  expect(driver.state.score).toBeGreaterThan(10n ** 16n);
  expect(driver.peakGauge).toBeGreaterThanOrEqual((rules.maxBloomGauge * 99n) / 100n);
});
