import { routes, type RouteId } from '../content/routes';
import { tracks } from '../content/tracks';
import { scoreMultipliers } from '../content/balance';
import { createGame } from '../domain/game/simulation';
import type { CardSkillVariantMaster } from '../domain/game/cards/cardTypes';
import type { GameState } from '../domain/game/model';

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
