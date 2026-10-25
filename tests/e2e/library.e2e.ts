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

test('うなばら:生成と回収増幅を準備し終盤の連打で京へ到達する', () => {
  const driver = new GameDriver('library');
  driver.report('開始');
  expect(driver.state.storyAmplification).toBe(0);
  prepare(driver);
  driver.report('準備完了');
  expect(driver.seconds).toBeLessThan(25);
  expect(durationSeconds(driver.state)).toBe(60);
  for (const token of ['story', 'clock', 'bookmark'])
    expect(driver.state.deck.some((card) => card.token === token)).toBe(true);
  expect(driver.state.stats.cardsUsed).toBeGreaterThan(driver.cardActions);
  expect(driver.state.storyAmplification).toBeGreaterThan(0);
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
  const firstStory = driver.inputs.find(
    (row) => row.input.kind === 'card' && row.input.card.instanceId.startsWith('story-'),
  );
  if (!firstStory) throw new Error('増幅後の貝がら使用がありません。');
  const earlierRedraws = driver.inputs.filter(
    (row) =>
      row.sequence < firstStory.sequence &&
      row.input.kind === 'collect' &&
      row.before.hand.map((card) => card.instanceId).join() !==
        row.after.hand.map((card) => card.instanceId).join(),
  );
  expect(firstStory.before.deckSize).toBeGreaterThanOrEqual(95);
  expect(earlierRedraws.length).toBeGreaterThanOrEqual(5);
  const firstRedraw = earlierRedraws[0];
  if (!firstRedraw) throw new Error('貝がら使用前の回収リドローがありません。');
  expect(firstStory.before.storyAmplification).toBeGreaterThan(
    firstRedraw.before.storyAmplification,
  );
  expect(lateRun.collections).toBeGreaterThan(lateRun.cards);
  expect(lateRun.redraws).toBeGreaterThan(0);
  expect(lateRun.collectionGain).toBeGreaterThan(lateRun.cardGain);
  expect(lateRun.gain * BigInt(lateStartTick)).toBeGreaterThan(lateBefore * BigInt(lateRun.ticks));
  expect(driver.state.score).toBeGreaterThan(omitted.state.score);
  expect(driver.state.score).toBeGreaterThan(unplanned.state.score);
  expect(driver.state.score).toBeGreaterThanOrEqual(10n ** 16n);
});

for (const seed of [456, 1234]) {
  test(`うなばら:別の初期手札でも準備から回収連鎖へ移行する（seed ${seed}）`, () => {
    const driver = new GameDriver('library', seed);
    prepare(driver);
    amplifyAndWiden(driver);
    const run = runCollections(driver, durationSeconds(driver.state), 15);
    expect(driver.state.phase).toBe('finished');
    expect(driver.state.hearts.heartLimit).toBe(10_000_000);
    expect(run.redraws).toBeGreaterThan(0);
    expect(run.collections).toBeGreaterThan(run.cards);
    expect(driver.state.score).toBeGreaterThanOrEqual(10n ** 16n);
  });
}

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

test('うなばら:autoOFFは速度別の回収と停止時の再始動、95枚補充で継続する', () => {
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
