import type { GameState } from '../model';
import { beatHeartCount } from '../beat';
import { moodValue, sectionAt } from '../projection';
import { voltageLevel } from '../live/voltageLevel';
import type { ConditionContext } from './model';

export function conditionContext(state: GameState): ConditionContext {
  const partIndex = state.track.sections.indexOf(sectionAt(state));
  const climax = state.track.sections.findIndex((part) => part.climax);
  return {
    heatLevel: voltageLevel(state.excitement, state.maximumVoltageLevel),
    staminaPercent: state.stamina,
    weather: moodValue(state),
    partIndex,
    partNumber:
      partIndex === climax ? 99 : partIndex - (climax >= 0 && climax < partIndex ? 1 : 0) + 1,
    cardCounts: {
      all: state.deck.length,
      draw: state.drawPile.length,
      discard: state.discard.length,
      excluded: state.cardPool.length - state.deck.length,
    },
    tokenSeries: state.deck.map((card) => card.tokenSeriesIds ?? []),
    supportLevels: state.supportLevels,
    naturalStars: beatHeartCount(state),
    bloomActive: state.bloom !== null,
  };
}
