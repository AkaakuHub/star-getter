import { resolveDeck, defaultDeckIds } from '../cards';
import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { routeTokens } from './tokens';

export const routeIds = ['library', 'bloom'] as const;
export type RouteId = (typeof routeIds)[number];
type Route = Readonly<{
  id: RouteId;
  name: string;
  slug: string;
  deck: readonly Card[];
  tokens: readonly Card[];
}>;
export const routes: Readonly<Record<RouteId, Route>> = {
  library: {
    id: 'library',
    name: 'うなばら',
    slug: 'unabara',
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
  bloom: {
    id: 'bloom',
    name: '開花',
    slug: 'kaika',
    tokens: routeTokens,
    deck: resolveDeck(defaultDeckIds),
  },
};
