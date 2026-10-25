import { calculateStarGatherGenesisGaugeDelta } from './genesisGauge';
import { changeResource } from '../resources';
import type { GaugeRegeneration } from '../modelTypes';
import type { GameState } from '../model';

export function startGaugeRegeneration(
  state: GameState,
  gauge: GaugeRegeneration['gauge'],
  amount: number,
  intervalType: 1 | 2,
  intervalMilliseconds: number,
  duration: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>,
): GameState {
  if (duration.kind === 'sections' && duration.value === 0)
    throw new Error('Display section count is 0. (displayTimeType: SECTION, displayTime: 0)');
  const intervalSeconds = Math.fround(intervalMilliseconds / 1000);
  const regeneration: GaugeRegeneration = {
    gauge,
    amount,
    intervalType,
    intervalSeconds,
    elapsedSeconds: 0,
    durationSeconds: duration.kind === 'milliseconds' ? Math.fround(duration.value / 1000) : null,
    durationElapsedSeconds: 0,
    remainingSections: duration.kind === 'sections' ? duration.value : null,
    remainingHeartEvents: duration.kind === 'sections' ? duration.value : null,
  };
  return {
    ...pulseGauge(state, gauge, amount),
    gaugeRegenerations: [...state.gaugeRegenerations, regeneration],
  };
}

export function advanceGaugeRegenerations(state: GameState, elapsedSeconds: number): GameState {
  const elapsed = Math.fround(elapsedSeconds);
  const active: GaugeRegeneration[] = [];
  let next = state;
  for (const regeneration of state.gaugeRegenerations) {
    let accumulated = Math.fround(regeneration.elapsedSeconds + elapsed);
    if (regeneration.intervalType === 1 && regeneration.intervalSeconds <= accumulated) {
      next = pulseGauge(next, regeneration.gauge, regeneration.amount);
      accumulated = Math.fround(accumulated - regeneration.intervalSeconds);
    }
    const durationElapsedSeconds = Math.fround(regeneration.durationElapsedSeconds + elapsed);
    if (
      regeneration.durationSeconds !== null &&
      durationElapsedSeconds >= regeneration.durationSeconds
    )
      continue;
    active.push({ ...regeneration, elapsedSeconds: accumulated, durationElapsedSeconds });
  }
  return { ...next, gaugeRegenerations: active };
}

export function expireGaugeRegenerations(
  state: GameState,
  duration: 'sections' | 'heart-event',
): GameState {
  return {
    ...state,
    gaugeRegenerations: state.gaugeRegenerations.flatMap((regeneration) => {
      if (duration === 'sections' && regeneration.remainingSections !== null) {
        const remainingSections = regeneration.remainingSections - 1;
        return remainingSections > 0 ? [{ ...regeneration, remainingSections }] : [];
      }
      if (duration === 'heart-event' && regeneration.remainingHeartEvents !== null) {
        const remainingHeartEvents = regeneration.remainingHeartEvents - 1;
        return remainingHeartEvents > 0 ? [{ ...regeneration, remainingHeartEvents }] : [];
      }
      return [regeneration];
    }),
  };
}

function pulseGauge(
  state: GameState,
  gauge: GaugeRegeneration['gauge'],
  amount: number,
): GameState {
  const value = Math.trunc(amount);
  if (gauge === 'mental') {
    return state.bloom ? state : changeResource(state, 'stamina', BigInt(value));
  }
  if (!state.bloom) return changeResource(state, 'excitement', BigInt(value));
  const delta = calculateStarGatherGenesisGaugeDelta({
    actionType: 0,
    gaugeType: 1,
    effectValue: value,
    currentGenesisEffectValue: state.bloom.strength,
  });
  if (delta === null) return state;
  const progress = BigInt.asIntN(32, state.bloom.progress + BigInt(delta));
  return { ...state, bloom: { ...state.bloom, progress: progress < 0n ? 0n : progress } };
}
