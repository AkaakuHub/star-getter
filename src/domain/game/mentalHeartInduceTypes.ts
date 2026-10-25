export type MentalHeartInduceEffect = Readonly<{
  kind: 'mental-heart-induce';
  num: number;
  heartDuration: Readonly<{ kind: 'milliseconds' | 'stage'; value: number }>;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  disabledType: 0 | 1;
  disabledValue: number;
  invocationType?: number;
  deactivationKey?: string;
}>;

export type MentalHeartInducer = Readonly<{
  id: number;
  sourceCardId: string | null;
  precomputedNum: number;
  heartLifetimeSeconds: number;
  remainingSeconds: number | null;
  remainingSections: number | null;
  disabledOnInduceCount: number | null;
  induces: number;
  deactivationKey: string | null;
}>;
