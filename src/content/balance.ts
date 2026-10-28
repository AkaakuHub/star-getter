import type { RouteId } from './routes';

export const stageTiming = {
  durationSeconds: 90,
  preparationSeconds: 25,
  bpm: 120,
} as const;

export const scoreMultipliers: Readonly<Record<RouteId, bigint>> = {
  library: 2n,
  genesis: 1n,
};
