import type { Card, Effect, GameState } from '../model';
import { enqueueModeChange, takeModeChange } from '../live/modes';

type ApplyEffect = (
  state: GameState,
  effect: Effect,
  card?: Card,
  multiplier?: number,
) => GameState;

export function drainModeChanges(state: GameState, apply: ApplyEffect): GameState {
  if (state.modes.held || state.modes.changing) return state;
  let next: GameState = { ...state, modes: { ...state.modes, changing: true } };
  while (next.modes.queue.length) {
    const transition = takeModeChange(next.modes);
    next = { ...next, modes: transition.state };
    if (!transition.changed?.on) continue;
    const modeId = transition.changed.id;
    const listeners = next.modeReactions
      .map((reaction, index) => ({ reaction, index }))
      .filter(({ reaction }) => reaction.modeId === modeId);
    for (const { reaction, index } of listeners) {
      const count = reaction.count + 1;
      next = {
        ...next,
        modes: {
          ...next.modes,
          entries: next.modes.entries.map((entry) =>
            entry.id === modeId ? { ...entry, induceValue: count } : entry,
          ),
        },
        modeReactions: next.modeReactions.map((item, slot) =>
          slot === index ? { ...item, count } : item,
        ),
      };
      const source =
        reaction.sourceId === null
          ? undefined
          : next.cardPool.find((card) => card.id === reaction.sourceId);
      for (let slot = 0; slot < reaction.thresholds.length; slot++) {
        const threshold = reaction.thresholds[slot];
        if (threshold === undefined || count % threshold !== 0) continue;
        const effect = reaction.effects[slot];
        if (!effect) break;
        const scales =
          effect.kind === 'hearts' ||
          effect.kind === 'boost' ||
          effect.kind === 'stamina' ||
          effect.kind === 'excitement';
        const multiplier = scales
          ? Math.trunc(Math.fround(Math.fround(reaction.buffNum * count) / 10000))
          : 1;
        next = apply(next, effect, source, multiplier);
      }
    }
  }
  return { ...next, modes: { ...next.modes, changing: false } };
}

export function changeMode(
  state: GameState,
  effect: Extract<Effect, { kind: 'mode' }>,
  apply: ApplyEffect,
): GameState {
  return drainModeChanges(
    {
      ...state,
      modes: enqueueModeChange(state.modes, { modeId: effect.modeId, change: effect.change }),
    },
    apply,
  );
}

export function addModeReaction(
  state: GameState,
  effect: Extract<Effect, { kind: 'mode-reaction' }>,
  card?: Card,
): GameState {
  if (!state.modes.entries.some((entry) => entry.id === effect.modeId)) return state;
  return {
    ...state,
    modes: {
      ...state.modes,
      entries: state.modes.entries.map((entry) =>
        entry.id === effect.modeId ? { ...entry, displayInduce: true } : entry,
      ),
    },
    modeReactions: [
      ...state.modeReactions,
      {
        sourceId: card?.id ?? null,
        modeId: effect.modeId,
        thresholds: effect.thresholds,
        effects: effect.effects,
        buffNum: effect.buffNum,
        count: 0,
      },
    ],
  };
}
