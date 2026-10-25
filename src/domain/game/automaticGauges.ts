import type { GameState } from './model';
import { advanceStarGatherApGauge } from './live/apGauge';
import { changeBloomResource } from './bloom';
import { changeResource } from './resources';
import { durationSeconds } from './projection';

export function advanceAutomaticGauges(state: GameState, dt: number): GameState {
  const stage = state.track.stage;
  const ap = advanceStarGatherApGauge(
    {
      currentAp: Math.floor(state.energy),
      maxAp: state.maxEnergy,
      timerSeconds: state.apTimerSeconds,
    },
    {
      deltaTimeSeconds: dt,
      mentalDown: state.resting,
      increaseIntervalSeconds: Math.fround(
        Math.max(0, state.apIntervalFactor + state.apStageIntervalFactor - 1) *
          stage.apIncreaseIntervalSeconds,
      ),
    },
  ).state;
  let next = changeResource(state, 'energy', BigInt(ap.currentAp - Math.floor(state.energy)));
  next = {
    ...next,
    apTimerSeconds: ap.timerSeconds,
    voltageTimerSeconds:
      state.voltageStops.length > 0
        ? state.voltageTimerSeconds
        : Math.fround(Math.fround(state.voltageTimerSeconds) + Math.fround(dt)),
  };
  while (
    next.voltageStops.length === 0 &&
    stage.voltageIncreaseIntervalSeconds < next.voltageTimerSeconds
  ) {
    next = changeResource(
      {
        ...next,
        voltageTimerSeconds: Math.fround(
          next.voltageTimerSeconds - stage.voltageIncreaseIntervalSeconds,
        ),
      },
      'excitement',
      1n,
    );
  }
  if (next.bloom && (next.mentalProtected || next.sectionMentalProtected)) return next;
  let mentalTimerSeconds = Math.fround(Math.fround(next.mentalTimerSeconds) + Math.fround(dt));
  const resting =
    !(next.mentalProtected || next.sectionMentalProtected) && (next.resting || next.stamina <= 0);
  if (resting) {
    const recoveryTime = Math.fround(
      Math.trunc(Math.fround(Math.fround((durationSeconds(next) * 1000) / 120000) * 6000)) / 1000,
    );
    const stamina = Math.min(
      100,
      Math.fround(next.stamina + Math.fround(Math.fround(60 * Math.fround(dt)) / recoveryTime)),
    );
    return { ...next, mentalTimerSeconds, stamina, resting: stamina < 60 };
  }
  while (stage.mentalDecreaseIntervalSeconds < mentalTimerSeconds) {
    mentalTimerSeconds = Math.fround(mentalTimerSeconds - stage.mentalDecreaseIntervalSeconds);
    next = next.bloom
      ? changeBloomResource(next, 'stamina', -1n)
      : { ...next, stamina: Math.max(0, next.stamina - 1) };
  }
  return {
    ...next,
    mentalTimerSeconds,
    resting: !(next.mentalProtected || next.sectionMentalProtected) && next.stamina <= 0,
  };
}
