export type WaitModeState = Readonly<{
  kind: 'disabled' | 'initial' | 'reserved' | 'force-reserved' | 'waiting';
  remainingCoolTimeSeconds: number;
}>;

const waitModeCoolTimeSeconds = 0.35;
const waitModeCoolTimeAtStartSeconds = 0.05;

export function releaseWaitMode(): WaitModeState {
  return {
    kind: 'reserved',
    remainingCoolTimeSeconds: waitModeCoolTimeSeconds,
  };
}

export function advanceWaitMode(
  state: WaitModeState,
  input: Readonly<{
    enabled: boolean;
    hasAvailableSkill: boolean;
    deltaTimeSeconds: number;
  }>,
): WaitModeState {
  if (!Number.isFinite(input.deltaTimeSeconds) || input.deltaTimeSeconds < 0) {
    throw new Error('自動停止の経過時間が正しくありません。');
  }
  if (!input.enabled) {
    return { kind: 'disabled', remainingCoolTimeSeconds: 0 };
  }
  if (state.kind === 'disabled') {
    return {
      kind: 'force-reserved',
      remainingCoolTimeSeconds: 0,
    };
  }
  if (state.kind === 'waiting') return state;
  if (state.kind === 'force-reserved') {
    return input.hasAvailableSkill
      ? { kind: 'waiting', remainingCoolTimeSeconds: 0 }
      : {
          kind: 'initial',
          remainingCoolTimeSeconds: waitModeCoolTimeAtStartSeconds,
        };
  }
  const remainingCoolTimeSeconds = Math.max(
    0,
    state.remainingCoolTimeSeconds - input.deltaTimeSeconds,
  );
  if (state.kind === 'initial') {
    return remainingCoolTimeSeconds > 0
      ? { kind: 'initial', remainingCoolTimeSeconds }
      : releaseWaitMode();
  }
  if (!input.hasAvailableSkill) {
    return { kind: 'reserved', remainingCoolTimeSeconds };
  }
  return remainingCoolTimeSeconds > 0
    ? { kind: 'reserved', remainingCoolTimeSeconds }
    : { kind: 'waiting', remainingCoolTimeSeconds: 0 };
}
