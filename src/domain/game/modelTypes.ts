import type { MemberId, TokenKind, UnitId } from './model';

export type MoodBonus = Readonly<{ target: 1 | 2 | 3; perPoint: number }>;
export type GaugeInfinity = Readonly<{
  gauge: 'ap' | 'voltage' | 'mental';
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;
export type InfinityGaugeEffect = Readonly<{
  kind: 'infinity-gauge';
  gauge: 'ap' | 'voltage' | 'mental';
  duration: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
}>;
export type GaugeRegeneration = Readonly<{
  gauge: 'mental' | 'voltage';
  amount: number;
  intervalType: 1 | 2;
  intervalSeconds: number;
  elapsedSeconds: number;
  durationSeconds: number | null;
  durationElapsedSeconds: number;
  remainingSections: number | null;
  remainingHeartEvents: number | null;
}>;
export type GaugeRegenerationEffect = Readonly<{
  kind: 'gauge-regeneration';
  gauge: GaugeRegeneration['gauge'];
  amount: number;
  intervalType: 1 | 2;
  intervalMilliseconds: number;
  duration: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
}>;
export type GaugeEffect = InfinityGaugeEffect | GaugeRegenerationEffect | MentalBarrierEffect;
export type MentalBarrier = Readonly<{
  kind: 'endurance' | 'attenuation';
  endurance: number;
  currentEndurance: number;
  attenuation: number;
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;
export type MentalBarrierEffect = Readonly<{
  kind: 'mental-barrier';
  barrier: 'endurance' | 'attenuation';
  enduranceType: 'ratio' | 'fixed' | 'infinite';
  endurance: number;
  attenuation: number;
  duration:
    | Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>
    | Readonly<{ kind: 'stage' }>;
}>;
export type ResetSpecial = Readonly<{
  kind: 'reset-special';
  scope: 'normal' | 'extra' | 'all';
  target:
    | Readonly<{ kind: 'all' | 'source' | 'others' }>
    | Readonly<{ kind: 'member'; member: MemberId }>
    | Readonly<{ kind: 'unit'; unit: UnitId }>;
}>;
export type SearchTarget =
  | Readonly<{ kind: 'icon'; icon: number }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'token-series'; seriesId: number }>
  | Readonly<{ kind: 'token'; token: TokenKind }>;
export type SearchRequest = Readonly<{
  scope: 'grade' | 'section' | 'skill';
  target: SearchTarget;
}>;
export type TokenBoostTarget =
  | Readonly<{ kind: 'all' }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'card-series'; seriesId: number }>;
export type HeartBoostTarget =
  | Readonly<{ kind: 'all' }>
  | Readonly<{ kind: 'member'; member: MemberId }>
  | Readonly<{ kind: 'unit'; unit: UnitId }>
  | Readonly<{ kind: 'card-series'; seriesId: number }>;
export type HeartBoostEffect = Readonly<{
  kind: 'heart-boost';
  percent: number;
  uses: number;
  target?: HeartBoostTarget;
  duration?: Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>;
  moodBonus?: MoodBonus;
}>;
export type HeartBoostState = Readonly<{
  percent: number;
  uses: number;
  target: HeartBoostTarget;
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;
export type TokenBoost = Readonly<{
  calculation: 'add' | 'multiply-percent';
  value: number;
  target: TokenBoostTarget;
  seriesIds?: readonly number[];
  remainingUses: number | null;
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;
