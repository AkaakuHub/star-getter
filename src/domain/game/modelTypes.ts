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
export type TokenBoost = Readonly<{
  calculation: 'add' | 'multiply-percent';
  value: number;
  target: TokenBoostTarget;
  seriesIds?: readonly number[];
  remainingUses: number | null;
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;
