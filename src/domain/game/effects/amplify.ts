import { calculateSkillMoodCorrection } from '../live/skillMood';
import { moodValue } from '../projection';
import type { Effect, GameState } from '../model';

type AmplifyEffect = Extract<Effect, { kind: 'amplify' }>;

export function applyAmplifyEffect(state: GameState, effect: AmplifyEffect): GameState {
  const percent =
    effect.percent +
    (effect.moodBonus
      ? calculateSkillMoodCorrection(
          effect.moodBonus.target,
          moodValue(state),
          effect.moodBonus.perPoint,
        )
      : 0);
  if (effect.members)
    return {
      ...state,
      targetBoosts: [
        ...state.targetBoosts,
        {
          members: effect.members,
          percent,
          duration: effect.duration ?? 'stage',
          ...(effect.deactivationKey ? { deactivationKey: effect.deactivationKey } : {}),
        },
      ],
    };
  return {
    ...state,
    amplification: Math.fround(state.amplification + percent),
    sectionAmplification:
      state.sectionAmplification + (effect.duration === 'section' ? percent : 0),
  };
}
