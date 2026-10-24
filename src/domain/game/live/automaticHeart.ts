export type AutomaticHeartState = Readonly<{ enabled: boolean; timerSeconds: number }>;

export function advanceAutomaticHeart(
  state: AutomaticHeartState,
  heartCount: number,
  deltaTimeSeconds: number,
): Readonly<{ state: AutomaticHeartState; shouldCollect: boolean }> {
  if (!state.enabled || heartCount < 100)
    return { state: { ...state, timerSeconds: 0 }, shouldCollect: false };
  const timerSeconds = state.timerSeconds + deltaTimeSeconds;
  if (timerSeconds < 0.3) return { state: { ...state, timerSeconds }, shouldCollect: false };
  return { state: { ...state, timerSeconds: 0 }, shouldCollect: true };
}
