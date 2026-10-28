import { routes } from '../content/routes';
import { setupCards, type GameSetup } from './setup/gameSetup';
import { tracks } from '../content/tracks';
import { scoreMultipliers } from '../content/balance';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import type { CardSkillVariantMaster } from '@akaakuhub/suku-sute-core/game/cards/cardTypes';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';

export function createConfiguredGame(
  setup: GameSetup,
  seed: number,
  heartShowLimit: number,
  cardSkillVariants: readonly CardSkillVariantMaster[] = [],
): GameState {
  const route = routes[setup.presetId];
  const track = tracks[0];
  if (!track) throw new Error('ステージがありません。');
  return {
    ...createGame(track, setupCards(setup), seed, heartShowLimit, route.tokens, cardSkillVariants),
    scoreMultiplier: scoreMultipliers[setup.presetId],
  };
}
