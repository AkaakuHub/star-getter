import { cardCost } from './cards/cost';
import { type Card, type GameState, type Section, rules } from './model';

export function sectionAt(state: GameState): Section {
  const beat = ((state.tick / rules.ticksPerSecond) * state.track.bpm) / 60;
  const section = state.track.sections.findLast((item) => item.startBeat <= beat);
  if (!section) throw new Error('現在の区間がありません。');
  return section;
}

export function durationSeconds(state: GameState): number {
  return (state.track.beats * 60) / state.track.bpm;
}

export function cardAt(state: GameState, index: number): Card {
  const id = state.hand[index];
  const card = state.deck.find((item) => item.id === id);
  if (!card) throw new Error('手札にカードがありません。');
  return card;
}

export function canUseCard(state: GameState, index: number): boolean {
  return (
    state.phase === 'playing' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < state.hand.length &&
    !state.resting &&
    state.tick - state.lastActionTick >= rules.actionCooldownTicks &&
    (state.bloom !== null || state.energy >= cardCost(state, cardAt(state, index)))
  );
}
