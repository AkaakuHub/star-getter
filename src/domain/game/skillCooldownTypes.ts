export type SkillCooldownEffect = Readonly<{
  id: number;
  num: number;
  deckUnderAdd: number;
  deckOverAdd: number;
  deckUnderLimit: number;
  deckOverLimit: number;
  deckCardMax: number | null;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  updatesWithDeckCount: boolean;
  remainingSeconds: number | null;
  remainingSections: number | null;
  deactivationKey: string | null;
}>;

export type SkillCooldownEffectInput = Readonly<{
  kind: 'skill-cooldown';
  num: number;
  deckUnderAdd: number;
  deckOverAdd: number;
  deckUnderLimit: number;
  deckOverLimit: number;
  deckCardMax: number | null;
  duration: Readonly<{ kind: 'milliseconds' | 'sections' | 'stage'; value: number }>;
  invocationType?: number;
  deactivationKey?: string;
}>;

export function validateSkillCooldownEffect(effect: SkillCooldownEffectInput): void {
  if (
    !Number.isSafeInteger(effect.num) ||
    !Number.isSafeInteger(effect.deckUnderAdd) ||
    !Number.isSafeInteger(effect.deckOverAdd) ||
    !Number.isSafeInteger(effect.deckUnderLimit) ||
    !Number.isSafeInteger(effect.deckOverLimit) ||
    !Number.isSafeInteger(effect.duration.value) ||
    (effect.duration.kind === 'sections' && effect.duration.value === 0) ||
    ((effect.deckUnderAdd !== 0 || effect.deckOverAdd !== 0) &&
      (effect.deckCardMax === null ||
        !Number.isSafeInteger(effect.deckCardMax) ||
        effect.deckCardMax < 1)) ||
    (effect.deckCardMax !== null &&
      (!Number.isSafeInteger(effect.deckCardMax) || effect.deckCardMax < 1)) ||
    (effect.invocationType !== undefined && !Number.isSafeInteger(effect.invocationType)) ||
    (effect.deactivationKey !== undefined && typeof effect.deactivationKey !== 'string')
  )
    throw new Error('スキルクールタイムの設定が正しくありません。');
}
