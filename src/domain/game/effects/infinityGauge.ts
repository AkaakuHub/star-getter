import { voltageThreshold } from '../live/voltageLevel';
import type { Effect, GameState } from '../model';

export function activateInfinityGauge(
  state: GameState,
  effect: Extract<Effect, { kind: 'infinity-gauge' }>,
): GameState {
  if (effect.duration.kind === 'sections' && effect.duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  if (state.bloom) {
    const progress = BigInt.asIntN(32, state.bloom.progress + 500n);
    return { ...state, bloom: { ...state.bloom, progress: progress < 0n ? 0n : progress } };
  }
  const active = {
    gauge: effect.gauge,
    remainingSeconds:
      effect.duration.kind === 'milliseconds' ? Math.fround(effect.duration.value / 1000) : null,
    remainingSections: effect.duration.kind === 'sections' ? effect.duration.value : null,
  };
  const firstActivation = !state.gaugeInfinities.some(
    (infinity) => infinity.gauge === effect.gauge,
  );
  const next = { ...state, gaugeInfinities: [...state.gaugeInfinities, active] };
  if (effect.gauge === 'ap') return { ...next, energy: next.maxEnergy };
  if (effect.gauge === 'mental' && firstActivation && !state.resting)
    return { ...next, stamina: 100, mentalTimerSeconds: 0 };
  return { ...next, excitement: voltageThreshold(next.maximumVoltageLevel) };
}
