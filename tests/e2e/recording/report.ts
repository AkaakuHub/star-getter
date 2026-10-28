import { moodValue } from '@akaakuhub/suku-sute-core/game/projection';
import { heartCount } from '@akaakuhub/suku-sute-core/game/hearts';
import type { GameDriver } from '../driver';

export function reportDriver(driver: GameDriver, stage: string): void {
  console.log(
    JSON.stringify({
      route: driver.route,
      stage,
      seconds: Number(driver.seconds.toFixed(3)),
      wallSeconds: Number(driver.wallSeconds.toFixed(3)),
      inputTiming: driver.timing,
      cardActions: driver.cardActions,
      cardsUsed: driver.state.stats.cardsUsed,
      specialActions: driver.specialActions,
      collectionActions: driver.collections,
      automaticCollections: driver.automaticCollections,
      successfulCollections: driver.successfulCollections,
      collectionRedraws: driver.collectionRedraws,
      collectionAmplification: driver.collectionAmplification,
      heartsCollected: driver.state.stats.heartsCollected,
      hearts: heartCount(driver.state),
      heartLimit: driver.state.hearts.heartLimit,
      storyAmplification: driver.state.storyAmplification,
      tokens: Object.fromEntries(
        ['story', 'clock', 'bookmark', 'ensemble', 'shadow'].map((token) => [
          token,
          driver.state.deck.filter((card) => card.token === token).length,
        ]),
      ),
      deck: driver.state.deck.length,
      currentAp: driver.state.ap.currentAp,
      mental: driver.state.mental.currentMental,
      currentVoltage: driver.state.voltage.currentVoltage.toString(),
      mood: moodValue(driver.state),
      scoreMultiplier: driver.state.scoreMultiplier.toString(),
      classUses: driver.state.cardUseCounts.class ?? 0,
      shadowUses: driver.state.cardUseCounts['shadow-1'] ?? 0,
      score: driver.state.score.toString(),
      gauge:
        driver.state.genesis.effects.length > 0
          ? driver.state.genesis.currentGauge.toString()
          : null,
      genesisStrength: driver.state.genesis.effects[0]?.effectValue ?? null,
      peakGauge: driver.peakGauge.toString(),
      peakDeckSize: driver.peakDeckSize,
      peakHeartLimit: driver.peakHeartLimit,
    }),
  );
}
