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
    state.energy >= cardAt(state, index).cost
  );
}

export function scoreMultiplier(state: GameState): number {
  const boost = state.boosts.reduce((value, item) => value * item.multiplier, 1);
  const level = Math.floor(state.excitement / 20);
  return (1 + level * 0.25) * (sectionAt(state).climax ? 1.5 : 1) * boost;
}

export function scoreGrade(state: GameState): string {
  const ratio = state.score / state.track.targetScore;
  if (ratio >= 1.5) return 'S';
  if (ratio >= 1) return 'A';
  if (ratio >= 0.6) return 'B';
  return 'C';
}
