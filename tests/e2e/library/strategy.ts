import { type GameState, rules } from '@akaakuhub/suku-sute-core/game/model';
import { moodValue } from '@akaakuhub/suku-sute-core/game/projection';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
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

export async function prepare(driver: GameDriver, waitMode: boolean): Promise<void> {
  await driver.setWaitMode(waitMode);
  let normalUsed = false;
  let extraUsed = false;
  await driver.until(isPrepared, async () => {
    if (
      !normalUsed &&
      (driver.state.cardUseCounts.class ?? 0) >= 1 &&
      (await driver.special('library-pages'))
    )
      normalUsed = true;
    if (
      normalUsed &&
      !extraUsed &&
      driver.state.deck.some((card) => card.token === 'clock') &&
      driver.state.deck.some((card) => card.token === 'bookmark') &&
      (await driver.special('library-ensemble'))
    )
      extraUsed = true;
    if (
      normalUsed &&
      extraUsed &&
      driver.state.deck.length < 80 &&
      !driver.state.specialUsed.includes('library-pages')
    )
      await driver.special('library-pages');
    const used = await driver.useFirst(
      driver.state.deck.length < 95
        ? [
            'class',
            'library-invitation',
            'library-pages',
            'library-ensemble',
            'ensemble',
            'bookmark',
            'clock',
            'aurora-ensemble',
            'camera',
            'story',
          ]
        : [
            ...(moodValue(driver.state) < 100 ? ['clock'] : []),
            'class',
            'story',
            'bookmark',
            'library-invitation',
            'ensemble',
            'library-ensemble',
            'clock',
            'camera',
            'library-pages',
            'aurora-ensemble',
          ],
    );
    if (!used) driver.collect();
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

async function restoreDeck(driver: GameDriver): Promise<void> {
  const clocks = driver.state.deck.filter((card) => card.token === 'clock').length;
  await driver.useFirst([
    'library-invitation',
    'library-ensemble',
    'ensemble',
    'library-pages',
    ...(moodValue(driver.state) < 100 || clocks > 3 ? ['clock'] : []),
    'bookmark',
    'story',
    'clock',
    'aurora-ensemble',
    'camera',
  ]);
  if (driver.inputTick % 6 === 0) driver.collect();
}

async function maintainLoop(driver: GameDriver): Promise<void> {
  if (driver.state.deck.length < 95) {
    await restoreDeck(driver);
    return;
  }
  if (moodValue(driver.state) < 100) {
    await driver.useFirst([
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
  } else if (!hasAvailableBookmark(driver.state) || heartCount(driver.state) < 500_000) {
    await driver.useFirst([
      'library-ensemble',
      'library-invitation',
      'bookmark',
      'ensemble',
      'story',
      'aurora-ensemble',
      'library-pages',
      'camera',
    ]);
  }
  if (driver.inputTick % 6 === 0) driver.collect();
}

export async function amplifyAndWiden(driver: GameDriver): Promise<void> {
  const initialAmplification = driver.state.storyAmplification;
  await driver.until(
    (state) => driver.collectionRedraws >= 5 && state.storyAmplification > initialAmplification,
    () => maintainLoop(driver),
  );
  driver.report('回収リドローを反復し舵のドローで増幅');
  await driver.until(
    (state) => state.hearts.heartLimit === 10_000_000 && state.deck.length >= 100,
    async () => {
      if (driver.state.deck.length < 100) {
        await restoreDeck(driver);
      } else {
        await driver.useFirst([
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
      if (driver.inputTick % 6 === 0) driver.collect();
    },
  );
  await armAutomaticCollection(driver);
  driver.report('1000万上限へ到達');
  expect(driver.state.hearts.heartLimit).toBe(10_000_000);
  expect(driver.collectionRedraws).toBeGreaterThanOrEqual(5);
  expect(driver.collectionAmplification).toBeGreaterThan(0);
}

export async function armAutomaticCollection(driver: GameDriver): Promise<void> {
  await driver.until(
    (state) =>
      isPrepared(state) &&
      state.deck.length >= 100 &&
      state.deck.some(
        (card) =>
          card.token === 'story' &&
          state.hand.includes(card.id) &&
          !state.relayUsed.includes(card.id),
      ),
    () => (driver.state.deck.length < 100 ? restoreDeck(driver) : maintainLoop(driver)),
  );
}

export async function playUnplanned(driver: GameDriver): Promise<void> {
  while (driver.state.phase === 'playing') {
    await driver.special('library-pages');
    await driver.special('library-ensemble');
    await driver.useFirst(
      driver.state.hand.map((id) => {
        const card = driver.state.deck.find((candidate) => candidate.id === id);
        if (!card) throw new Error('手札のカードがありません。');
        return card.token ?? card.id;
      }),
    );
    if (driver.inputTick % 6 === 0) driver.collect();
    await driver.tick();
  }
}

export async function runCollections(driver: GameDriver, stopSeconds: number, speed: 5 | 10 | 15) {
  await driver.setWaitMode(false);
  const before = driver.state.score;
  const cards = driver.cardActions;
  const collections = driver.collections;
  const redraws = driver.collectionRedraws;
  const start = driver.state.tick;
  const until = Math.round(stopSeconds * rules.ticksPerSecond);
  const interval = rules.ticksPerSecond / speed;
  let nextCollection = driver.inputTick;
  let deckRepairs = 0;
  let minimumDeck = driver.state.deck.length;
  let collectionGain = 0n;
  let cardGain = 0n;
  let streak = 0;
  let maximumStreak = 0;
  let repairing = false;
  while (driver.state.phase === 'playing' && driver.state.tick < until) {
    if (driver.inputTick >= nextCollection) {
      if (repairing || heartCount(driver.state) === 0 || driver.state.deck.length < 95) {
        if (!repairing) {
          await driver.setWaitMode(true);
          repairing = true;
        }
        const cardBefore = driver.state.score;
        const deckBefore = driver.state.deck.length;
        const used =
          driver.state.deck.length <= 96
            ? await driver.useFirst([
                'library-invitation',
                'ensemble',
                'library-ensemble',
                'clock',
                'bookmark',
                'aurora-ensemble',
                'library-pages',
                'camera',
                'story',
              ])
            : await driver.useFirst(
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
        if (
          deckBefore <= 96 &&
          driver.state.deck.length > deckBefore &&
          driver.state.deck.length >= 95
        )
          deckRepairs++;
        minimumDeck = Math.min(minimumDeck, driver.state.deck.length);
        cardGain += driver.state.score - cardBefore;
        if (used) streak = 0;
        if (isPrepared(driver.state)) {
          await driver.setWaitMode(false);
          repairing = false;
        }
      } else {
        const collectionBefore = driver.state.score;
        driver.collect();
        collectionGain += driver.state.score - collectionBefore;
        streak++;
        maximumStreak = Math.max(maximumStreak, streak);
      }
      nextCollection = driver.inputTick + interval;
    }
    await driver.tick();
  }
  const gain = driver.state.score - before;
  const result = {
    gain,
    deckRepairs,
    minimumDeck,
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
