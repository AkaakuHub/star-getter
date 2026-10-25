export type MentalBarrier = Readonly<{
  kind: 'endurance' | 'attenuation';
  endurance: number;
  currentEndurance: number;
  attenuation: number;
  remainingSeconds: number | null;
  remainingSections: number | null;
  deactivationKey?: string | null;
}>;

export type MentalBarrierEffect = Readonly<{
  kind: 'mental-barrier';
  barrier: 'endurance' | 'attenuation';
  enduranceType: 'ratio' | 'fixed' | 'infinite';
  endurance: number;
  enduranceMoodBonus?: Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
  attenuation: number;
  attenuationMoodBonus?: Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
  deactivationKey?: string;
  invocationType?: number;
  duration:
    | Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>
    | Readonly<{ kind: 'stage' }>;
}>;
