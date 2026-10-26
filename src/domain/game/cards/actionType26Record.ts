import type { ActionTypeDetail } from './actionTypeDetail';

export type ActionType26Record = Readonly<{
  actionType: 26;
  skillEffectId: bigint;
  details: readonly ActionTypeDetail[];
  destination: 'effects' | 'handPermanentEffects';
  invocationType?: number;
  deactivationKey?: string;
}>;
