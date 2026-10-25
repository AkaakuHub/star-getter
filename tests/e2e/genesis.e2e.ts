import { expect, test } from 'vite-plus/test';
import { durationSeconds, moodValue } from '../../src/domain/game/projection';
import { heartCount } from '../../src/domain/game/hearts';
import { rules } from '../../src/domain/game/model';
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

function activate(driver: GameDriver): number {
  let payment = 0;
  driver.until(
    (state) => state.bloom !== null,
    () => {
      driver.special('library-ensemble');
      const energy = driver.state.energy;
      if (driver.special('horizon')) {
        payment = energy - 20;
        return;
      }
      driver.useFirst(['class', 'camera', 'horizon', 'perennial']);
      driver.collect();
    },
  );
  driver.report('共鳴を先に発動');
  return payment;
}

function prepare(driver: GameDriver, stableCollection = true): void {
  const target = (rules.maxBloomGauge * 99n) / 100n;
  while (
    driver.seconds < durationSeconds(driver.state) - 2 &&
    (driver.state.bloom?.progress ?? 0n) < target
  ) {
    const created = driver.state.deck.some((card) => card.token === 'shadow');
    const shadowUses = driver.state.cardUseCounts['shadow-1'] ?? 0;
    const next =
      !created && shadowUses === 0
        ? ['frost-echo', ...priority]
        : moodValue(driver.state) > -100
          ? ['rain-preparation', 'frost-echo', ...priority]
          : shadowUses < 14
            ? driver.state.hand.some((id) => id.startsWith('shadow-'))
              ? ['shadow', 'frost-echo', 'sunrise', 'rain-preparation']
              : ['frost-echo', 'sunrise', 'rain-preparation', 'aurora-ensemble']
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
        driver.burst(2, 10);
        if (driver.collectionRedraws - redraws === 20 && heartCount(driver.state) >= 500_000)
          return;
      }
    }
    driver.useFirst(
      shadowUses >= 14 && moodValue(driver.state) <= -100 && heartCount(driver.state) < 500_000
        ? driver.cardActions % 3 === 0
          ? ['sunrise', 'frost-pulse', ...next]
          : ['frost-pulse', 'sunrise', ...next]
        : next,
    );
    if (!driver.state.specialUsed.includes('library-ensemble')) driver.special('library-ensemble');
    driver.special('horizon');
    if (driver.state.tick % 6 === 0) driver.collect();
    driver.tick();
  }
}

test('開花:共鳴→追加カード→雨→除外→引き直しで専用値を育てて手動回収する', () => {
  const driver = new GameDriver('bloom');
  driver.report('開始');
  const paidEnergy = activate(driver);
  expect(driver.state.cardUseCounts['frost-echo'] ?? 0).toBe(0);
  expect(driver.state.cardUseCounts['rain-preparation'] ?? 0).toBe(0);
  expect(driver.state.bloom?.rollback.energy).toBe(paidEnergy);
  const initialGauge = driver.state.bloom?.progress ?? 0n;
  const ordinary = [driver.state.energy, driver.state.stamina, driver.state.excitement];
  const earlyBefore = driver.state.score;
  driver.burst(2, 10);
  const earlyGain = driver.state.score - earlyBefore;
  prepare(driver);
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
  expect([driver.state.energy, driver.state.stamina, driver.state.excitement]).toEqual(ordinary);
  expect(driver.state.cardUseCounts['shadow-1']).toBeGreaterThanOrEqual(14);
  const measurementTick = driver.state.tick;
  const before = driver.state.score;
  driver.burst(2, 10);
  const preparedGain = driver.state.score - before;
  driver.report('連打2秒');
  const plain = new GameDriver('bloom');
  plain.burst(measurementTick / rules.ticksPerSecond, 10);
  const plainBefore = plain.state.score;
  plain.burst(2, 10);
  const plainGain = plain.state.score - plainBefore;
  plain.burst(durationSeconds(plain.state) - plain.seconds, 10);
  plain.report('カード未使用60秒');
  while (driver.state.phase === 'playing') {
    if (moodValue(driver.state) > -100) driver.useFirst(['rain-preparation', 'sunrise']);
    if (driver.state.tick % 4 === 0) driver.collect();
    driver.tick();
  }
  driver.report('15回毎秒で60秒終了');
  const omitted = new GameDriver('bloom');
  const omittedGain = omitted.finishWithCards(priority, measurementTick);
  omitted.report('順序を省略した連打');
  console.log(
    JSON.stringify({
      route: 'bloom',
      earlyGain: earlyGain.toString(),
      preparedGain: preparedGain.toString(),
      plainGain: plainGain.toString(),
      omittedGain: omittedGain.toString(),
      peakGauge: driver.peakGauge.toString(),
      target: ((rules.maxBloomGauge * 99n) / 100n).toString(),
    }),
  );
  expect(plain.state.score).toBeLessThan(100_000_000n);
  expect(preparedGain).toBeGreaterThan(earlyGain);
  expect(preparedGain).toBeGreaterThan(plainGain);
  expect(driver.state.score).toBeGreaterThan(omitted.state.score);
  expect.soft(driver.state.score).toBeGreaterThanOrEqual(10n ** 16n);
});

test('開花:カード準備を専用値上限の直前まで継続する', () => {
  const driver = new GameDriver('bloom');
  activate(driver);
  driver.burst(2, 10);
  prepare(driver, false);
  driver.report('専用値目標までカード準備を継続');
  driver.burst(durationSeconds(driver.state) - driver.seconds, 15);
  driver.report('専用値準備後の15回毎秒で60秒終了');
  expect(driver.state.score).toBeGreaterThanOrEqual(10n ** 16n);
  expect(driver.peakGauge).toBeGreaterThanOrEqual((rules.maxBloomGauge * 99n) / 100n);
});
