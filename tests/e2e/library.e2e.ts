import { expect, test } from 'vite-plus/test';
import { durationSeconds } from '../../src/domain/game/projection';
import { GameDriver } from './driver';
import {
  libraryPriority,
  prepare,
  amplifyAndWiden,
  armAutomaticCollection,
  playUnplanned,
  runCollections,
} from './library/strategy';

test('うなばら:3種類を生成し95枚を準備して連打、巻き込み後に修復する', () => {
  const driver = new GameDriver('library');
  driver.report('開始');
  prepare(driver);
  driver.report('準備完了');
  expect(driver.seconds).toBeLessThan(25);
  expect(durationSeconds(driver.state)).toBe(60);
  for (const token of ['story', 'clock', 'bookmark'])
    expect(driver.state.deck.some((card) => card.token === token)).toBe(true);
  expect(driver.state.stats.cardsUsed).toBeGreaterThan(driver.cardActions);
  const measurementTick = driver.state.tick;
  const unplanned = new GameDriver('library');
  playUnplanned(unplanned);
  unplanned.report('手札の先頭から使用可能なカードを使って60秒終了');
  const omitted = new GameDriver('library');
  omitted.finishWithCards(libraryPriority, measurementTick);
  omitted.report('共鳴の準備を省略して終了');
  amplifyAndWiden(driver);
  const lateBefore = driver.state.score;
  const lateStartTick = driver.state.tick;
  const lateRun = runCollections(driver, durationSeconds(driver.state), 15);
  driver.report('連鎖停止時だけカードで再始動し手動回収主体で60秒終了');
  expect(lateRun.collections).toBeGreaterThan(lateRun.cards);
  expect(lateRun.redraws).toBeGreaterThan(0);
  expect(lateRun.collectionGain).toBeGreaterThan(lateRun.cardGain);
  expect(lateRun.gain * BigInt(lateStartTick)).toBeGreaterThan(lateBefore * BigInt(lateRun.ticks));
  expect(driver.state.score).toBeGreaterThan(omitted.state.score);
  expect(driver.state.score).toBeGreaterThan(unplanned.state.score);
  expect(driver.state.score).toBeGreaterThanOrEqual(10n ** 16n);
});

test('うなばら:同じ曲で未準備の回収と準備後の回収を比較する', () => {
  const prepared = new GameDriver('library');
  prepare(prepared);
  const start = prepared.seconds;
  const score = prepared.state.score;
  prepared.burst(2, 10);
  const preparedGain = prepared.state.score - score;
  const plain = new GameDriver('library');
  plain.burst(start, 10);
  const plainScore = plain.state.score;
  plain.burst(2, 10);
  const plainGain = plain.state.score - plainScore;
  prepared.report('準備あり比較');
  plain.report('カード未使用比較');
  plain.burst(durationSeconds(plain.state) - plain.seconds, 10);
  plain.report('カード未使用60秒');
  expect(plain.state.score).toBeLessThan(100_000_000n);
  console.log(
    JSON.stringify({
      route: 'library',
      preparedGain: preparedGain.toString(),
      plainGain: plainGain.toString(),
      tapsPerSecond: 10,
      measurementSeconds: 2,
    }),
  );
  expect(preparedGain).toBeGreaterThan(plainGain);
});

test('うなばら:同じ時刻の手動回収でも次の反応を回収できる', () => {
  const driver = new GameDriver('library');
  prepare(driver);
  const tick = driver.state.tick;
  const before = driver.state.score;
  driver.collect();
  const first = driver.state.score;
  driver.collect();
  driver.report('同じ時刻に2回手動回収');
  expect(first).toBeGreaterThan(before);
  expect(driver.state.score).toBeGreaterThan(first);
  expect(driver.state.tick).toBe(tick);
});

test('うなばら:autoONはカードも手動回収も使わず間隔付きで連鎖する', () => {
  const driver = new GameDriver('library');
  prepare(driver);
  amplifyAndWiden(driver);
  armAutomaticCollection(driver);
  driver.toggleAutomaticHearts();
  expect(driver.state.automaticHeart.enabled).toBe(true);
  const cards = driver.cardActions;
  const uses = driver.state.stats.cardsUsed;
  const collections = driver.collections;
  const hearts = driver.state.stats.heartsCollected;
  const score = driver.state.score;
  const automaticCollections = driver.automaticCollections;
  const until = driver.state.tick + 2 * 60;
  driver.tick();
  expect(driver.state.stats.heartsCollected).toBe(hearts);
  expect(driver.automaticCollections).toBe(automaticCollections);
  while (driver.state.tick < until) driver.tick();
  driver.report('自動回収ONで2秒間カードも回収操作も無使用');
  expect(driver.cardActions).toBe(cards);
  expect(driver.state.stats.cardsUsed).toBe(uses);
  expect(driver.collections).toBe(collections);
  expect(driver.state.stats.heartsCollected).toBeGreaterThan(hearts);
  expect(driver.automaticCollections - automaticCollections).toBeGreaterThanOrEqual(2);
  expect(driver.automaticCollections - automaticCollections).toBeLessThanOrEqual(6);
  expect(driver.state.score).toBeGreaterThan(score);
});

test('うなばら:autoOFFは5/10/15回毎秒で回収し停止時だけカードで再始動する', () => {
  const scores: bigint[] = [];
  let repairs = 0;
  for (const speed of [5, 10, 15] as const) {
    const driver = new GameDriver('library');
    prepare(driver);
    amplifyAndWiden(driver);
    expect(driver.state.automaticHeart.enabled).toBe(false);
    const run = runCollections(driver, durationSeconds(driver.state), speed);
    scores.push(driver.state.score);
    repairs += run.deckRepairs;
    driver.report(speed + '回毎秒と停止時だけカードで60秒終了');
    expect(run.collections).toBeGreaterThan(run.cards);
    expect(run.redraws).toBeGreaterThan(0);
    expect(run.collectionGain).toBeGreaterThan(run.cardGain);
  }
  const [slow, medium, fast] = scores;
  if (slow === undefined || medium === undefined || fast === undefined)
    throw new Error('回収速度の比較結果がありません。');
  expect(medium).toBeGreaterThan(slow);
  expect(fast).toBeGreaterThan(medium);
  expect(repairs).toBeGreaterThan(0);
});
