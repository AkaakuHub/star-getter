import type { RouteId } from './routes';

export const scoreMultipliers: Readonly<Record<RouteId, bigint>> = {
  library: 1n,
  bloom: 1n,
};
