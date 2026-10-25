import type { Effect, MemberId } from './model';

export type ComboInduceEvent = Readonly<{ member: MemberId; ap: number }>;
export type ComboInduceMemberAp = Readonly<{ member: MemberId; ap: number | null }>;

export type ComboInducer = Readonly<{
  sourceCardId: string;
  members: readonly ComboInduceMemberAp[];
  apPower: bigint;
  repeatAction: 0 | 1 | 2;
  effects: readonly Effect[];
  addValue: number;
  multiplier: number;
  remainingSeconds: number | null;
  remainingSections: number | null;
  deactivationKey: string | null;
  active: boolean;
  phase: 'collecting' | 'activating' | 'resetting';
  phaseRemainingSeconds: number;
  events: readonly ComboInduceEvent[];
}>;
