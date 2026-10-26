import type { Effect } from '../modelTypes';
import type { HandUseTrigger } from './handUseTrigger';
export type { HandUseTrigger } from './handUseTrigger';

export type HandInducer = Readonly<{
  sourceEffectId: string;
  trigger: HandUseTrigger;
  effects: readonly Effect[];
  limit?: bigint;
  limitMemory?: 'reset' | 'retain';
}>;

export function handInducerStateKey(cardId: string, sourceEffectId: string): string {
  return `${cardId}:${sourceEffectId}`;
}
