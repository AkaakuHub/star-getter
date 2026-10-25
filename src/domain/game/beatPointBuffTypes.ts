export type BeatPointBuff = Readonly<{
  value: number;
  remainingSections: number | null;
  deactivationKey: string | null;
}>;

export type BeatPointBuffEffect = Readonly<{
  kind: 'beat-point-buff';
  amount: number;
  moodBonus?: Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
  duration: Readonly<{ kind: 'sections'; value: number }> | Readonly<{ kind: 'stage' }>;
  invocationType?: number;
  deactivationKey?: string;
}>;
