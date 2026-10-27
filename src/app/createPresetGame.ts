import { routes, type RouteId } from '../content/routes';
import { tracks } from '../content/tracks';
import { scoreMultipliers } from '../content/balance';
import { createGame } from '@akaakuhub/suku-sute-core/game/simulation';
import type { CardSkillVariantMaster } from '@akaakuhub/suku-sute-core/game/cards/cardTypes';
import type { GameState } from '@akaakuhub/suku-sute-core/game/model';

export function createPresetGame(
  routeId: RouteId,
  seed: number,
  heartShowLimit: number,
  cardSkillVariants: readonly CardSkillVariantMaster[] = [],
): GameState {
  const route = routes[routeId];
  const track = tracks[0];
  if (!track) throw new Error('ステージがありません。');
  return {
    ...createGame(track, route.deck, seed, heartShowLimit, route.tokens, cardSkillVariants),
    scoreMultiplier: scoreMultipliers[routeId],
  };
}
