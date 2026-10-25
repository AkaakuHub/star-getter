import type { Effect } from './modelTypes';

export type DrawSuccessInduceEffect = Readonly<{
  kind: 'draw-success-induce';
  sourceEffectId: string;
  branchType: bigint;
  branchValue: bigint;
  disabledType?: bigint;
  whenTrue: readonly Effect[];
  whenFalse: readonly Effect[];
}>;
