import type { RouteId } from './routes';

export const stageTiming = {
  durationSeconds: 60,
  preparationSeconds: 25,
  bpm: 120,
} as const;

export const scoreMultipliers: Readonly<Record<RouteId, bigint>> = {
  library: 1n,
  bloom: 1n,
};
