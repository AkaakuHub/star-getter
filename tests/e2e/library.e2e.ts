import { expect, test } from 'vite-plus/test';
import type { GameState } from '../../src/domain/game/model';
import { moodValue, durationSeconds } from '../../src/domain/game/projection';
import { GameDriver } from './driver';
import { heartCount } from '../../src/domain/game/hearts';

const priority = [
  'class',
  'bookmark',
  'library-pages',
  'library-invitation',
  'clock',
  'camera',
  'library-ensemble',
  'ensemble',
  'story',
  'aurora-ensemble',
];

function isPrepared(state: GameState): boolean {
  const hand = state.deck.filter((card) => state.hand.includes(card.id));
  return (
    state.deck.length >= 95 &&
    state.hearts.heartLimit >= 500_000 &&
    hand.some((card) => card.token === 'story') &&
    hand.some((card) => card.token === 'bookmark' && !state.relayUsed.includes(card.id)) &&
    moodValue(state) === 100 &&
    heartCount(state) >= 500_000
  );
}

function prepare(driver: GameDriver): void {
  let normalUses = 0;
  let extraUsed = false;
  driver.until(isPrepared, () => {
    if (
      (driver.state.cardUseCounts.class ?? 0) >= 2 &&
      (driver.state.cardUseCounts['library-pages'] ?? 0) >= 1 &&
      (normalUses < 2 || (extraUsed && normalUses < 3)) &&
      driver.special('library-pages')
    )
      normalUses++;
    if (
      normalUses === 2 &&
      !extraUsed &&
      driver.state.deck.some((card) => card.token === 'clock') &&
      driver.state.deck.some((card) => card.token === 'bookmark') &&
      driver.special('library-ensemble')
    ) {
      extraUsed = true;
    }
    const reserveClass = (driver.state.cardUseCounts.class ?? 0) === 2 && normalUses === 0;
    driver.useFirst(
      reserveClass ? ['library-pages', ...priority.filter((id) => id !== 'class')] : priority,
    );
  });
}

test('書架:3種類を生成し95枚を準備して連打、巻き込み後に修復する', () => {
  const driver = new GameDriver('library');
  driver.report('開始');
  prepare(driver);
  driver.report('準備完了');
  for (const token of ['story', 'clock', 'bookmark'])
    expect(driver.state.deck.some((card) => card.token === token)).toBe(true);
  expect(driver.state.stats.cardsUsed).toBeGreaterThan(driver.cardActions);
  expect(driver.state.cardUseCounts.class).toBe(3);
  expect(driver.state.deck.some((card) => card.id === 'class')).toBe(false);
  const before = driver.state.score;
  const measurementTick = driver.state.tick;
  const cards = driver.cardActions;
  driver.burst(2, 10);
  driver.report('10回毎秒で2秒回収');
  expect(driver.state.score).toBeGreaterThan(before);
  const preparedGain = driver.state.score - before;
  expect(driver.cardActions).toBe(cards);
  expect(driver.state.deck.length).toBeGreaterThanOrEqual(95);
  driver.until(
    (state) => state.deck.length < 95,
    () => {
      driver.useFirst(['aurora-ensemble', 'ensemble', 'library-ensemble', ...priority]);
      driver.collect();
    },
  );
  driver.report('巻き込みで95枚未満');
  driver.until(
    (state) => state.deck.length >= 95,
    () => {
      driver.useFirst(['library-ensemble', 'ensemble', ...priority]);
      driver.collect();
    },
  );
  driver.report('95枚へ修復');
  expect(driver.state.deck.length).toBeGreaterThanOrEqual(95);
  const readyForLateBurst = (state: GameState) =>
    driver.seconds >= durationSeconds(state) - 15 && isPrepared(state);
  driver.until(readyForLateBurst, () => {
    driver.useFirst(
      driver.state.deck.length < 95
        ? ['library-ensemble', 'ensemble', 'library-pages', 'library-invitation', ...priority]
        : priority,
    );
    if (!readyForLateBurst(driver.state) && driver.state.tick % 6 === 0) driver.collect();
  });
  const lateBefore = driver.state.score;
  driver.burst(2, 10);
  const lateGain = driver.state.score - lateBefore;
  driver.report('成長後に2秒回収');
  while (driver.state.phase === 'playing') {
    if (driver.state.tick % 6 === 0) driver.collect();
    driver.tick();
  }
  driver.report('60秒終了');
  const omitted = new GameDriver('library');
  const omittedGain = omitted.finishWithCards(priority, measurementTick);
  omitted.report('共鳴の準備を省略して終了');
  console.log(
    JSON.stringify({
      route: 'library',
      preparedGain: preparedGain.toString(),
      omittedGain: omittedGain.toString(),
      lateGain: lateGain.toString(),
      measurementSeconds: 2,
      tapsPerSecond: 10,
    }),
  );
  expect(preparedGain).toBeGreaterThan(omittedGain);
  expect(lateGain).toBeGreaterThan(preparedGain);
  expect(driver.state.score).toBeGreaterThan(omitted.state.score);
  expect(driver.state.score).toBeGreaterThanOrEqual(10n ** 16n);
});

test('書架:同じ曲で未準備の回収と準備後の回収を比較する', () => {
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

test('書架:同じ時刻の手動回収でも次の反応を回収できる', () => {
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
