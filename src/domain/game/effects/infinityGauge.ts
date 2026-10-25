import { voltageThreshold } from '../live/voltageLevel';
import type { Effect, GameState } from '../model';
import { induceMentalHearts } from './mentalHeartInduce';

export function activateInfinityGauge(
  state: GameState,
  effect: Extract<Effect, { kind: 'infinity-gauge' }>,
): GameState {
  if (effect.duration.kind === 'sections' && effect.duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  const suppressDuration = effect.invocationType === 0x388 || effect.invocationType === 0x38b;
  const bloom = state.bloom;
  const suspended = bloom !== null;
  const active = {
    gauge: effect.gauge,
    remainingSeconds:
      !suppressDuration && effect.duration.kind === 'milliseconds'
        ? Math.fround(effect.duration.value / 1000)
        : null,
    remainingSections:
      !suppressDuration && effect.duration.kind === 'sections' ? effect.duration.value : null,
    suspended,
    deactivationKey: effect.deactivationKey ?? null,
  };
  const firstActivation = !state.gaugeInfinities.some(
    (infinity) => infinity.gauge === effect.gauge,
  );
  let next = { ...state, gaugeInfinities: [...state.gaugeInfinities, active] };
  if (bloom) {
    const progress = BigInt.asIntN(32, bloom.progress + 500n);
    return { ...next, bloom: { ...bloom, progress: progress < 0n ? 0n : progress } };
  }
  if (!firstActivation) return next;
  if (effect.gauge === 'ap') return { ...next, energy: next.maxEnergy };
  if (effect.gauge === 'mental' && !state.resting)
    return induceMentalHearts(
      { ...next, stamina: next.maximumMental, mentalTimerSeconds: 0 },
      next.maximumMental,
    );
  if (effect.gauge === 'voltage')
    next = { ...next, excitement: voltageThreshold(next.maximumVoltageLevel) };
  return next;
}
