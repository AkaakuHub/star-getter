export type WaitModeState = Readonly<{
  kind: 'disabled' | 'initial' | 'reserved' | 'force-reserved' | 'waiting';
  remainingCoolTimeSeconds: number;
  previousAvailableCards: number;
  previousSkillPoint: number;
}>;

export function createWaitMode(): WaitModeState {
  return {
    kind: 'disabled',
    remainingCoolTimeSeconds: 0,
    previousAvailableCards: 0,
    previousSkillPoint: 0,
  };
}

export function releaseWaitMode(state: WaitModeState, skillUsed: boolean): WaitModeState {
  return {
    ...state,
    kind: skillUsed ? 'force-reserved' : 'initial',
    remainingCoolTimeSeconds: 0.35,
  };
}

export function advanceWaitMode(
  state: WaitModeState,
  input: Readonly<{
    enabled: boolean;
    availableCards: number;
    skillPoint: number;
    ableUseSkill: boolean;
    mentalDown: boolean;
    deltaTimeSeconds: number;
  }>,
): WaitModeState {
  if (!Number.isFinite(input.deltaTimeSeconds) || input.deltaTimeSeconds < 0) {
    throw new Error('自動停止の経過時間が正しくありません。');
  }
  if (!input.enabled) return createWaitMode();
  if (state.kind === 'waiting') return state;
  const remainingCoolTimeSeconds = Math.max(
    0,
    state.remainingCoolTimeSeconds - input.deltaTimeSeconds,
  );
  const next: WaitModeState = {
    ...state,
    remainingCoolTimeSeconds,
    previousSkillPoint: input.skillPoint,
  };
  if (state.kind !== 'reserved' && state.previousSkillPoint === input.skillPoint) return next;
  if (
    remainingCoolTimeSeconds <= 0 &&
    input.ableUseSkill &&
    !input.mentalDown &&
    (state.kind === 'force-reserved' || state.previousAvailableCards !== input.availableCards)
  ) {
    return {
      ...next,
      previousAvailableCards: input.availableCards,
      kind:
        input.availableCards !== 0
          ? 'waiting'
          : state.kind === 'force-reserved'
            ? 'force-reserved'
            : 'reserved',
    };
  }
  return {
    ...next,
    kind:
      state.kind === 'force-reserved'
        ? 'force-reserved'
        : input.mentalDown
          ? 'initial'
          : 'reserved',
  };
}
