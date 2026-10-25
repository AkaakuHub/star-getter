type StarGatherApGaugeState = Readonly<{
  currentAp: number;
  maxAp: number;
  timerSeconds: number;
}>;

type StarGatherApGaugeFrame = Readonly<{
  state: StarGatherApGaugeState;
  gaugeDisplayValue: number | null;
}>;

export function advanceStarGatherApGauge(
  state: StarGatherApGaugeState,
  input: Readonly<{
    deltaTimeSeconds: number;
    mentalDown: boolean;
    increaseIntervalSeconds: number;
  }>,
): StarGatherApGaugeFrame {
  validateState(state);
  validateFiniteNonNegative(input.deltaTimeSeconds, 'delta time');
  if (!Number.isFinite(input.increaseIntervalSeconds)) {
    throw new Error('StarGather AP increase interval is invalid');
  }
  if (state.currentAp >= state.maxAp || input.mentalDown) {
    return { state, gaugeDisplayValue: null };
  }

  let currentAp = state.currentAp;
  let timerSeconds = Math.fround(
    Math.fround(state.timerSeconds) + Math.fround(input.deltaTimeSeconds),
  );
  const increaseIntervalSeconds = Math.fround(input.increaseIntervalSeconds);
  if (increaseIntervalSeconds <= 0) {
    currentAp = state.maxAp;
  } else {
    while (increaseIntervalSeconds < timerSeconds) {
      timerSeconds = Math.fround(timerSeconds - increaseIntervalSeconds);
      currentAp = Math.min(currentAp + 1, state.maxAp);
    }
  }

  const nextState = { currentAp, maxAp: state.maxAp, timerSeconds };
  return { state: nextState, gaugeDisplayValue: currentAp };
}

function validateState(state: StarGatherApGaugeState): void {
  if (
    !Number.isSafeInteger(state.currentAp) ||
    state.currentAp < 0 ||
    !Number.isSafeInteger(state.maxAp) ||
    state.maxAp < 0 ||
    state.currentAp > state.maxAp
  ) {
    throw new Error('StarGather AP gauge value is invalid');
  }
  validateFiniteNonNegative(state.timerSeconds, 'timer');
}

function validateFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`StarGather AP ${label} is invalid`);
  }
}
