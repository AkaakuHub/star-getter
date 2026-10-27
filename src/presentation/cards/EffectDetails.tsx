import { describeCondition } from './describeCondition';
import type { Effect } from '@akaakuhub/suku-sute-core/game/model';
import { describeEffect, effectConditions } from './describeEffect';
import { TierDetails } from './TierDetails';

export function EffectDetails({ effects }: Readonly<{ effects: readonly Effect[] }>) {
  return (
    <ol className="effect-details">
      {effects.map((effect, index) => {
        if (
          effect.kind === 'beat-hearts' &&
          index > 0 &&
          sameBeatEffect(effects[index - 1], effect)
        )
          return null;
        let repetitions = 1;
        if (effect.kind === 'beat-hearts')
          while (sameBeatEffect(effects[index + repetitions], effect)) repetitions++;
        return (
          <li key={index}>
            {effect.kind === 'branch' ? (
              <section className="effect-condition">
                <h4>{describeCondition(effect.condition)}のとき</h4>
                <EffectDetails effects={effect.whenTrue} />
                {effect.whenFalse.length > 0 && (
                  <>
                    <h4>それ以外のとき</h4>
                    <EffectDetails effects={effect.whenFalse} />
                  </>
                )}
              </section>
            ) : effect.kind === 'conditional' ? (
              <section className="effect-condition">
                <h4>{effectConditions[effect.condition]}のとき</h4>
                <EffectDetails effects={effect.effects} />
              </section>
            ) : effect.kind === 'voltage-tier' ? (
              <TierDetails effect={effect} />
            ) : (
              <>
                <p>{describeEffect(effect)}</p>
                {repetitions > 1 && <p>{repetitions}回繰り返す。</p>}
                {'moodBonus' in effect && effect.moodBonus && (
                  <p className="effect-mood">
                    空模様が
                    {effect.moodBonus.target === 1
                      ? '晴れ'
                      : effect.moodBonus.target === 3
                        ? '雨'
                        : '晴れ・雨'}
                    方向へ1%進むごとに、効果量が
                    {effect.moodBonus.perPoint < 0 ? '' : '+'}
                    {effect.moodBonus.perPoint * (effect.moodBonus.target === 2 ? 0.5 : 1)}
                    変化する。
                  </p>
                )}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function sameBeatEffect(previous: Effect | undefined, effect: Effect): boolean {
  return (
    previous?.kind === 'beat-hearts' &&
    effect.kind === 'beat-hearts' &&
    previous.amount === effect.amount &&
    previous.moodBonus?.target === effect.moodBonus?.target &&
    previous.moodBonus?.perPoint === effect.moodBonus?.perPoint
  );
}
