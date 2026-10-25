import { expect, test } from 'vite-plus/test';
import { durationSeconds, moodValue } from '../../src/domain/game/projection';
import { voltageLevel } from '../../src/domain/game/live/voltageLevel';
import { rules, type Effect } from '../../src/domain/game/model';
import { GameDriver } from './driver';

const priority = [
  'shadow',
  'class',
  'aurora-ensemble',
  'library-ensemble',
  'perennial',
  'camera',
  'frost-pulse',
  'horizon',
  'frost-echo',
];

function lowersMood(effect: Effect): boolean {
  return effect.kind === 'mood'
    ? effect.amount < 0
    : effect.kind === 'conditional'
      ? effect.effects.some(lowersMood)
      : false;
}

function prepare(driver: GameDriver): readonly number[] {
  const lowering = driver.state.deck
    .filter((card) => card.effects.some(lowersMood))
    .map((card) => card.id);
  const sectionEnd = driver.state.track.sections[1]?.startBeat;
  if (sectionEnd === undefined) throw new Error('第1区間の終了がありません。');
  const endTick = Math.round(((sectionEnd * 60) / driver.state.track.bpm) * rules.ticksPerSecond);
  const moodChanges: number[] = [];
  let firstSectionReady = false;
  driver.until(
    (state) => state.bloom !== null,
    () => {
      driver.special('library-ensemble');
      driver.special('frost-pulse');
      if (!firstSectionReady && driver.state.tick >= endTick)
        throw new Error('第1区間にカードで空模様を下げることができませんでした。');
      if (moodValue(driver.state) > -100) {
        const before = moodValue(driver.state);
        driver.useFirst(['class', ...lowering, 'camera', 'perennial', ...priority]);
        const after = moodValue(driver.state);
        if (after < before) moodChanges.push(after);
        if (after === -100 && driver.state.tick < endTick) firstSectionReady = true;
        return;
      }
      const shadowUses = driver.state.cardUseCounts['shadow-1'] ?? 0;
      if (shadowUses >= 14) {
        driver.special('horizon');
        return;
      }
      const recover = !driver.state.mentalProtected && driver.state.stamina < 60;
      const drawUnit = !driver.state.hand.some((id) => id.startsWith('shadow-')) && shadowUses < 14;
      driver.useFirst(
        recover
          ? ['horizon', ...(drawUnit ? ['frost-echo'] : []), ...priority]
          : drawUnit
            ? ['frost-echo', ...priority]
            : priority,
      );
      driver.collect();
    },
  );
  return moodChanges;
}

test('開花:20APで発動し通常ゲージの条件を保って準備と連打を計測する', () => {
  const driver = new GameDriver('bloom');
  driver.report('開始');
  expect(driver.state.track.sections.every((section) => section.moodValue > -100)).toBe(true);
  const moodChanges = prepare(driver);
  expect(moodChanges.length).toBeGreaterThanOrEqual(2);
  expect(moodChanges.at(-1)).toBe(-100);
  driver.report('20APで開花');
  expect(driver.state.specialUsed).toContain('horizon');
  expect(driver.state.bloom?.rollback.energy).toBe(0);
  expect(driver.state.stamina).toBe(0);
  expect(voltageLevel(driver.state.excitement, driver.state.maximumVoltageLevel)).toBe(999);
  expect(moodValue(driver.state)).toBe(-100);
  const ordinaryVoltage = driver.state.excitement;
  const initialGauge = driver.state.bloom?.progress ?? 0n;
  const earlyBefore = driver.state.score;
  driver.burst(2, 10);
  const earlyGain = driver.state.score - earlyBefore;
  driver.report('発動直後に2秒回収');
  const prepareUntil = durationSeconds(driver.state) - 3;
  while (driver.seconds < prepareUntil) {
    driver.useFirst(priority);
    if (driver.state.tick % 6 === 0) driver.collect();
    driver.tick();
  }
  driver.report('連打前');
  expect(driver.state.bloom?.progress).toBeGreaterThan(initialGauge);
  expect(driver.state.stamina).toBe(0);
  expect(driver.state.excitement).toBe(ordinaryVoltage);
  const before = driver.state.score;
  const measurementTick = driver.state.tick;
  driver.burst(2, 10);
  driver.report('10回毎秒で2秒回収');
  const preparedGain = driver.state.score - before;
  expect(driver.state.score).toBeGreaterThan(before);
  const plain = new GameDriver('bloom');
  plain.burst(prepareUntil, 10);
  const baseline = plain.state.score;
  plain.burst(2, 10);
  plain.report('カード未使用比較');
  console.log(
    JSON.stringify({
      route: 'bloom',
      preparedGain: (driver.state.score - before).toString(),
      earlyGain: earlyGain.toString(),
      plainGain: (plain.state.score - baseline).toString(),
      tapsPerSecond: 10,
      measurementSeconds: 2,
      targetGauge: rules.maxBloomGauge.toString(),
      peakGauge: driver.peakGauge.toString(),
      targetReached: driver.peakGauge >= rules.maxBloomGauge,
    }),
  );
  expect(preparedGain).toBeGreaterThan(plain.state.score - baseline);
  expect(preparedGain).toBeGreaterThan(earlyGain);
  while (driver.state.phase === 'playing') {
    if (driver.state.tick % 6 === 0) driver.collect();
    driver.tick();
  }
  driver.report('60秒終了');
  const omitted = new GameDriver('bloom');
  const omittedGain = omitted.finishWithCards(priority, measurementTick);
  omitted.report('空模様と開花の準備を省略して終了');
  expect(preparedGain).toBeGreaterThan(omittedGain);
  expect(driver.state.score).toBeGreaterThan(omitted.state.score);
  expect(driver.state.score).toBeGreaterThanOrEqual(10n ** 16n);
});
