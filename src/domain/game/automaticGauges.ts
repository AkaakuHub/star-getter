import type { GameState } from './model';
import { advanceStarGatherApGauge } from './live/apGauge';
import { changeResource, decreaseMentalNaturally } from './resources';
import { mentalDecreaseInterval } from './live/mentalBarriers';
import { durationSeconds } from './projection';
import { apIncreaseIntervalSeconds } from './effects/apSpeed';
import { induceMentalHearts } from './effects/mentalHeartInduce';
import { registerMentalDownMission } from './ingameMissions';

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
      increaseIntervalSeconds: apIncreaseIntervalSeconds(state),
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
      'natural',
    );
  }
  if (next.bloom && (next.mentalProtected || next.sectionMentalProtected)) return next;
  let mentalTimerSeconds = Math.fround(Math.fround(next.mentalTimerSeconds) + Math.fround(dt));
  const resting =
    !(
      next.mentalProtected ||
      next.sectionMentalProtected ||
      next.disableMentalDownEffects.length > 0
    ) &&
    (next.resting || next.stamina <= 0);
  if (resting) {
    const recoveryTime = Math.fround(
      Math.trunc(Math.fround(Math.fround((durationSeconds(next) * 1000) / 120000) * 6000)) / 1000,
    );
    const stamina = Math.min(
      next.maximumMental,
      Math.fround(next.stamina + Math.fround(Math.fround(60 * Math.fround(dt)) / recoveryTime)),
    );
    const recovered = { ...next, mentalTimerSeconds, stamina, resting: stamina < 60 };
    const result =
      stamina !== next.stamina ? induceMentalHearts(recovered, Math.trunc(stamina)) : recovered;
    return !state.resting ? registerMentalDownMission(result) : result;
  }
  const mentalInterval = mentalDecreaseInterval(next, stage.mentalDecreaseIntervalSeconds);
  if (mentalInterval <= 0) {
    if (!next.bloom) {
      next = changeResource(next, 'stamina', -BigInt(Math.trunc(next.stamina)), 'natural');
      if (
        next.stamina <= 0 &&
        !(
          next.mentalProtected ||
          next.sectionMentalProtected ||
          next.disableMentalDownEffects.length > 0
        )
      ) {
        next = { ...next, resting: true };
        mentalTimerSeconds = 0;
      }
    }
  }
  while (0 < mentalInterval && mentalInterval < mentalTimerSeconds) {
    mentalTimerSeconds = Math.fround(mentalTimerSeconds - mentalInterval);
    next = decreaseMentalNaturally(next);
  }
  const result: GameState = {
    ...next,
    mentalTimerSeconds,
    resting:
      !(
        next.mentalProtected ||
        next.sectionMentalProtected ||
        next.disableMentalDownEffects.length > 0
      ) && next.stamina <= 0,
  };
  return !state.resting && result.resting ? registerMentalDownMission(result) : result;
}
