import type { MemberId, UnitId } from './model';

export type Action52BuffTarget =
  | Readonly<{ kind: 'all' }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'token-series'; seriesId: number }>;

export type Action52BuffEffect = Readonly<{
  kind: 'skill-boost';
  num: number;
  target: Action52BuffTarget;
  moodBonus?: Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  uses: number | null;
  skillTokenSeriesIds?: readonly number[];
  invocationType?: number;
  deactivationKey?: string;
}>;

export type Action52Buff = Readonly<{
  id: number;
  percent: number;
  target: Action52BuffTarget;
  remainingSeconds: number | null;
  remainingSections: number | null;
  remainingUses: number | null;
  skillTokenSeriesIds: readonly number[] | null;
  deactivationKey: string | null;
}>;
