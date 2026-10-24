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
      'halo',
      'sunrise',
      'orbit',
      'ember',
      'prism',
      'flare',
      'bounce',
      'tide',
      'dew',
    ]).map((card): Card => {
      if (card.id === 'halo')
        return {
          ...card,
          name: '書架の招待状',
          cost: 8,
          drawPreference: 'ensemble',
          effects: [{ kind: 'tokens', token: 'ensemble', count: 3 }],
        };
      if (card.id === 'sunrise')
        return {
          ...card,
          cost: 8,
          effects: [
            { kind: 'tokens', token: 'story', count: 8 },
            { kind: 'tokens', token: 'clock', count: 1 },
            { kind: 'tokens', token: 'bookmark', count: 1 },
          ],
        };
      return card;
    }),
  },
  bloom: {
    id: 'bloom',
    name: '開花',
    tokens: [],
    deck: resolveDeck(defaultDeckIds).map((card): Card =>
      card.id === 'ripple'
        ? { ...card, passive: { heartsPercent: 300, handLimitDelta: -3 } }
        : card,
    ),
  },
};
