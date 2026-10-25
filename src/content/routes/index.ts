import { resolveDeck, defaultDeckIds } from '../cards';
import type { Card } from '../../domain/game/model';
import { routeTokens } from './tokens';

export const routeIds = ['library', 'bloom'] as const;
export type RouteId = (typeof routeIds)[number];
type Route = Readonly<{
  id: RouteId;
  name: string;
  deck: readonly Card[];
  tokens: readonly Card[];
}>;
export const routes: Readonly<Record<RouteId, Route>> = {
  library: {
    id: 'library',
    name: '書架',
    tokens: routeTokens,
    deck: resolveDeck([
      'library-pages',
      'library-invitation',
      'library-ensemble',
      'aurora-ensemble',
      'camera',
      'class',
    ]),
  },
  bloom: { id: 'bloom', name: '開花', tokens: routeTokens, deck: resolveDeck(defaultDeckIds) },
};
