import type { Effect } from './modelTypes';

export type ProxyAbsorption = Readonly<{
  id: number;
  sourceId: string;
  hasAbsorbLimit: boolean;
  isAbsoluteAdd: boolean;
  periodType: 1 | 2 | 3 | 4 | 5;
  remainingPeriod: number;
  isAbsorbEnd: boolean;
  induceTiming: 1 | 2 | 3;
  induceCondition: 1 | 2;
  inducePowerType: 1 | 2 | 3;
  inducePowerParam: number;
  inducedEffects: readonly Readonly<{ actionType: number; effect: Effect }>[];
  effects: readonly Readonly<{
    actionType: number;
    targetAmount: bigint;
    totalAmount: bigint;
  }>[];
}>;

export type ProxySkillEffect = Readonly<{
  kind: 'proxy-skill';
  absorbLimit: number;
  periodType: 1 | 2 | 3 | 4 | 5;
  periodParam: number;
  induceTiming: 1 | 2 | 3;
  induceCondition: 1 | 2;
  inducePowerType: 1 | 2 | 3;
  inducePowerParam: number;
  targets: readonly Readonly<{ actionType: number; targetAmount: number }>[];
  effects: readonly Readonly<{ actionType: number; effect: Effect }>[];
}>;

export type ProxyForcedActivationEffect = Readonly<{
  kind: 'proxy-skill-forced-activation';
  targetType: 1 | 2 | 3 | 4 | 5;
}>;
