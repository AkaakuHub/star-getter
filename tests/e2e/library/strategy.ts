import { type GameState, rules } from '../../../src/domain/game/model';
import { moodValue } from '../../../src/domain/game/projection';
import { heartCount } from '../../../src/domain/game/hearts';
import { GameDriver } from '../driver';
import { expect } from 'vite-plus/test';

export const libraryPriority = [
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

export function isPrepared(state: GameState): boolean {
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

export function prepare(driver: GameDriver): void {
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
        : libraryPriority,
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

export function restoreDeck(driver: GameDriver): void {
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

export function maintainLoop(driver: GameDriver): void {
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

export function amplifyAndWiden(driver: GameDriver): void {
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

export function playUnplanned(driver: GameDriver): void {
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

export function runCollections(driver: GameDriver, stopSeconds: number, speed: 5 | 10 | 15) {
  const before = driver.state.score;
  const cards = driver.cardActions;
  const collections = driver.collections;
  const redraws = driver.collectionRedraws;
  const start = driver.state.tick;
  const until = Math.round(stopSeconds * rules.ticksPerSecond);
  const interval = rules.ticksPerSecond / speed;
  let collectionGain = 0n;
  let cardGain = 0n;
  let streak = 0;
  let maximumStreak = 0;
  while (driver.state.phase === 'playing' && driver.state.tick < until) {
    if ((driver.state.tick - start) % interval === 0) {
      if (heartCount(driver.state) === 0) {
        const cardBefore = driver.state.score;
        const used =
          driver.state.deck.length < 95
            ? driver.useFirst([
                'ensemble',
                'library-invitation',
                'library-pages',
                'library-ensemble',
                'bookmark',
                'clock',
                'story',
                'camera',
                'aurora-ensemble',
              ])
            : driver.useFirst(
                hasAvailableBookmark(driver.state)
                  ? [
                      'story',
                      'clock',
                      'bookmark',
                      'ensemble',
                      'library-ensemble',
                      'library-invitation',
                      'camera',
                      'library-pages',
                      'aurora-ensemble',
                    ]
                  : [
                      'bookmark',
                      'clock',
                      'library-invitation',
                      'ensemble',
                      'library-ensemble',
                      'camera',
                      'library-pages',
                      'story',
                      'aurora-ensemble',
                    ],
              );
        cardGain += driver.state.score - cardBefore;
        if (used) streak = 0;
      } else {
        const collectionBefore = driver.state.score;
        driver.collect();
        collectionGain += driver.state.score - collectionBefore;
        streak++;
        maximumStreak = Math.max(maximumStreak, streak);
      }
    }
    driver.tick();
  }
  const gain = driver.state.score - before;
  const result = {
    gain,
    collectionGain,
    cardGain,
    ticks: driver.state.tick - start,
    cards: driver.cardActions - cards,
    collections: driver.collections - collections,
    redraws: driver.collectionRedraws - redraws,
    maximumStreak,
    revenueBasisPoints: Number((gain * 10_000n) / driver.state.score),
  };
  console.log(
    JSON.stringify({
      route: 'library',
      speed,
      ...result,
      gain: gain.toString(),
      collectionGain: collectionGain.toString(),
      cardGain: cardGain.toString(),
    }),
  );
  return result;
}
