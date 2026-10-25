import { expect, test } from 'vite-plus/test';
import type { GameState } from '../../src/domain/game/model';
import { moodValue, durationSeconds } from '../../src/domain/game/projection';
import { GameDriver } from './driver';
import { heartCount } from '../../src/domain/game/hearts';

const priority = [
  'class',
  'ensemble',
  'library-invitation',
  'library-ensemble',
  'clock',
  'library-pages',
  'camera',
  'story',
  'aurora-ensemble',
  'bookmark',
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
  let normalUsed = false;
  let extraUsed = false;
  driver.until(isPrepared, () => {
    if (
      !normalUsed &&
      (driver.state.cardUseCounts.class ?? 0) >= 1 &&
      driver.special('library-pages')
    )
      normalUsed = true;
    if (
      normalUsed &&
      !extraUsed &&
      driver.state.deck.some((card) => card.token === 'clock') &&
      driver.state.deck.some((card) => card.token === 'bookmark') &&
      driver.special('library-ensemble')
    )
      extraUsed = true;
    driver.useFirst(
      driver.state.deck.length >= 80
        ? [
            'class',
            'story',
            'clock',
            'ensemble',
            'library-ensemble',
            'library-invitation',
            'camera',
            'library-pages',
            'bookmark',
            'aurora-ensemble',
          ]
        : priority,
    );
  });
}

function hasAvailableBookmark(state: GameState): boolean {
  return state.deck.some(
    (card) =>
      card.token === 'bookmark' &&
      state.hand.includes(card.id) &&
      !state.relayUsed.includes(card.id),
  );
}

function restoreDeck(driver: GameDriver): void {
  driver.useFirst([
    'ensemble',
    'library-invitation',
    'library-ensemble',
    'library-pages',
    'clock',
    'bookmark',
    'story',
    'camera',
    'aurora-ensemble',
  ]);
  if (driver.state.tick % 6 === 0) driver.collect();
}

function maintainLoop(driver: GameDriver): void {
  if (driver.state.deck.length < 95) {
    restoreDeck(driver);
    return;
  }
  if (moodValue(driver.state) < 100 || !hasAvailableBookmark(driver.state)) {
    driver.useFirst([
      'clock',
      'bookmark',
      'ensemble',
      'library-ensemble',
      'library-invitation',
      'story',
      'library-pages',
      'camera',
      'aurora-ensemble',
    ]);
  } else if (heartCount(driver.state) < 500_000) {
    driver.useFirst([
      'story',
      'ensemble',
      'library-ensemble',
      'aurora-ensemble',
      'clock',
      'bookmark',
      'library-invitation',
      'library-pages',
      'camera',
    ]);
  }
  if (driver.state.tick % 6 === 0) driver.collect();
}

function amplifyAndWiden(driver: GameDriver): void {
  const initialAmplification = driver.state.storyAmplification;
  driver.until(
    (state) => driver.collectionRedraws >= 5 && state.storyAmplification > initialAmplification,
    () => maintainLoop(driver),
  );
  driver.report('回収リドローを反復し舵のドローで増幅');
  driver.until(
    (state) => state.hearts.heartLimit === 10_000_000 && state.deck.length >= 95,
    () => {
      if (driver.state.deck.length < 95) {
        restoreDeck(driver);
      } else {
        driver.useFirst([
          'story',
          'clock',
          'ensemble',
          'library-ensemble',
          'bookmark',
          'library-invitation',
          'camera',
          'library-pages',
          'aurora-ensemble',
        ]);
      }
      if (driver.state.tick % 6 === 0) driver.collect();
    },
  );
  driver.report('1000万上限へ到達');
  expect(driver.state.hearts.heartLimit).toBe(10_000_000);
  expect(driver.collectionRedraws).toBeGreaterThanOrEqual(5);
  expect(driver.collectionAmplification).toBeGreaterThan(0);
  driver.until(isPrepared, () => maintainLoop(driver));
}

function playUnplanned(driver: GameDriver): void {
  while (driver.state.phase === 'playing') {
    driver.special('library-pages');
    driver.special('library-ensemble');
    driver.useFirst(
      driver.state.hand.map((id) => {
        const card = driver.state.deck.find((candidate) => candidate.id === id);
        if (!card) throw new Error('手札のカードがありません。');
        return card.token ?? card.id;
      }),
    );
    if (driver.state.tick % 6 === 0) driver.collect();
    driver.tick();
  }
}

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
  const before = driver.state.score;
  const measurementTick = driver.state.tick;
  const cards = driver.cardActions;
  driver.burst(2, 10);
  driver.report('10回毎秒で2秒回収');
  expect(driver.state.score).toBeGreaterThan(before);
  const preparedGain = driver.state.score - before;
  expect(driver.cardActions).toBe(cards);
  expect(driver.state.deck.length).toBeGreaterThanOrEqual(95);
  const unplanned = new GameDriver('library');
  playUnplanned(unplanned);
  unplanned.report('手札の先頭から使用可能なカードを使って60秒終了');
  const omitted = new GameDriver('library');
  const omittedGain = omitted.finishWithCards(priority, measurementTick);
  omitted.report('共鳴の準備を省略して終了');
  amplifyAndWiden(driver);
  driver.until(
    (state) => state.deck.length <= 96,
    () => {
      driver.useFirst(['story', 'aurora-ensemble', 'ensemble', 'library-ensemble']);
      if (driver.state.tick % 6 === 0) driver.collect();
    },
  );
  const repairSize = driver.state.deck.length;
  driver.report('96枚以下で補充前');
  driver.until(
    (state) => state.deck.length >= 97,
    () => restoreDeck(driver),
  );
  driver.report('潮の便りなどの生成で95枚以上を修復');
  expect(driver.state.deck.length).toBeGreaterThan(repairSize);
  const readyForLateBurst = (state: GameState) =>
    driver.seconds >= durationSeconds(state) - 10 && isPrepared(state);
  driver.until(readyForLateBurst, () => maintainLoop(driver));
  const lateBefore = driver.state.score;
  const lateCards = driver.cardActions;
  const lateUses = driver.state.stats.cardsUsed;
  driver.burst(2, 10);
  const lateGain = driver.state.score - lateBefore;
  driver.report('成長後に2秒回収');
  while (driver.state.phase === 'playing') {
    if (driver.state.tick % 6 === 0) driver.collect();
    driver.tick();
  }
  driver.report('終盤をカード無使用の手動回収で60秒終了');
  expect(driver.cardActions).toBe(lateCards);
  expect(driver.state.stats.cardsUsed).toBe(lateUses);
  expect(driver.state.score - lateBefore).toBeGreaterThan(lateBefore);
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
  driver.toggleAutomaticHearts();
  expect(driver.state.automaticHeart.enabled).toBe(true);
  const cards = driver.cardActions;
  const uses = driver.state.stats.cardsUsed;
  const collections = driver.collections;
  const hearts = driver.state.stats.heartsCollected;
  const score = driver.state.score;
  const amplification = driver.state.storyAmplification;
  const until = driver.state.tick + 2 * 60;
  driver.tick();
  expect(driver.state.stats.heartsCollected).toBe(hearts);
  while (driver.state.tick < until) driver.tick();
  driver.report('自動回収ONで2秒間カードも回収操作も無使用');
  expect(driver.cardActions).toBe(cards);
  expect(driver.state.stats.cardsUsed).toBe(uses);
  expect(driver.collections).toBe(collections);
  expect(driver.state.stats.heartsCollected).toBeGreaterThan(hearts);
  expect(driver.state.storyAmplification).toBeGreaterThan(amplification);
  expect(driver.state.score).toBeGreaterThan(score);
});

test('うなばら:autoOFFは同じ準備から5/10/15回毎秒の回収速度で得点が変わる', () => {
  const gains: bigint[] = [];
  for (const speed of [5, 10, 15]) {
    const driver = new GameDriver('library');
    prepare(driver);
    amplifyAndWiden(driver);
    expect(driver.state.automaticHeart.enabled).toBe(false);
    const before = driver.state.score;
    const cards = driver.cardActions;
    const uses = driver.state.stats.cardsUsed;
    driver.burst(2, speed);
    gains.push(driver.state.score - before);
    driver.report(speed + '回毎秒でカード無使用の2秒回収');
    expect(driver.cardActions).toBe(cards);
    expect(driver.state.stats.cardsUsed).toBe(uses);
  }
  const [slow, medium, fast] = gains;
  if (slow === undefined || medium === undefined || fast === undefined)
    throw new Error('回収速度の比較結果がありません。');
  expect(medium).toBeGreaterThan(slow);
  expect(fast).toBeGreaterThan(medium);
});
