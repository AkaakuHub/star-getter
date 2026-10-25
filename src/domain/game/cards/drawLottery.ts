import type { Card, GameState } from '../model';

type DrawCandidate = Readonly<{ id: string; weight: number }>;

export function drawCandidate(
  candidates: readonly DrawCandidate[],
  randomIndex: (maximumExclusive: number) => number,
): string | null {
  const priority = candidates.filter((candidate) => candidate.weight < 0);
  if (priority.length) return priority[randomIndex(priority.length)]?.id ?? null;
  const total = candidates.reduce((sum, candidate) => sum + Math.max(0, candidate.weight), 0);
  if (!total) return null;
  const roll = randomIndex(total);
  let cumulative = 0;
  for (const candidate of candidates) {
    cumulative += Math.max(0, candidate.weight);
    if (roll < cumulative) return candidate.id;
  }
  throw new Error('カードの抽選が成立しません。');
}

export function drawWeight(
  card: Card,
  state: Pick<GameState, 'drawContext' | 'lastUsedMember' | 'lastUsedUnit'>,
): number {
  const rule = card.drawRule;
  if (
    rule?.member !== undefined &&
    (state.drawContext !== 'skill' || state.lastUsedMember !== rule.member)
  )
    return 0;
  if (
    rule?.unit !== undefined &&
    (state.drawContext !== 'skill' || state.lastUsedUnit !== rule.unit)
  )
    return 0;
  return rule?.priority === 'always' ||
    (rule?.priority === 'after-start' && state.drawContext !== 'initial')
    ? -1
    : 1;
}
