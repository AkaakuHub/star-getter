import type { ActionTypeDetail } from './actionTypeDetail';

export type ActionType25Record = Readonly<{
  actionType: 25;
  skillEffectId: bigint;
  details: readonly ActionTypeDetail[];
  destination: 'effects' | 'handPermanentEffects';
  invocationType?: number;
  deactivationKey?: string;
}>;
