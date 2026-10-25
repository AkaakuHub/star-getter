import type { MoodBonus } from './modelTypes';

export type MentalShieldEffect = Readonly<{
  kind: 'mental-shield';
  durabilityType: 1 | 2 | 3;
  durability: number;
  moodBonus?: MoodBonus;
  duration:
    | Readonly<{ kind: 'milliseconds' | 'sections'; value: number }>
    | Readonly<{ kind: 'stage' }>;
  applyCount: number;
}>;

export type MentalShield = Readonly<{
  durabilityType: 1 | 2 | 3;
  durability: number;
  applyCount: number;
  remainingSeconds: number | null;
  remainingSections: number | null;
}>;

export function validateMentalShieldEffect(effect: MentalShieldEffect): void {
  if (
    !Number.isSafeInteger(effect.durability) ||
    !Number.isSafeInteger(effect.applyCount) ||
    (effect.duration.kind !== 'stage' && !Number.isSafeInteger(effect.duration.value)) ||
    (effect.moodBonus !== undefined &&
      (!Number.isFinite(effect.moodBonus.perPoint) ||
        ![0, 1, 2, 3].includes(effect.moodBonus.target)))
  )
    throw new Error('元気シールドの設定が正しくありません。');
}
