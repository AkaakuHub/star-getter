import type { Effect } from '../../domain/game/model';
import { calculateSkillMoodCorrection } from '../../domain/game/live/skillMood';
import { describeEffect, effectConditions } from './describeEffect';
import { targetNames } from './targetNames';

type TierEffect = Extract<Effect, { kind: 'voltage-tier' }>;

export function TierDetails({ effect }: Readonly<{ effect: TierEffect }>) {
  const first = effect.tiers[0];
  if (!first) return null;
  const normal = effect.tiers.map((tier) => tier.filter((item) => item.kind !== 'conditional'));
  const conditions = first.filter((item) => item.kind === 'conditional');
  return (
    <div className="tier-details">
      {normal[0]?.length ? <TierTable tiers={normal} mood={0} step={effect.step} /> : null}
      {conditions.map((condition) => (
        <section key={condition.condition}>
          <h4>{effectConditions[condition.condition]}のとき</h4>
          <TierTable
            tiers={effect.tiers.map((tier) =>
              tier.flatMap((item) =>
                item.kind === 'conditional' && item.condition === condition.condition
                  ? item.effects
                  : [],
              ),
            )}
            mood={
              condition.condition === 'mellow100'
                ? -100
                : condition.condition === 'happy100'
                  ? 100
                  : 0
            }
            step={effect.step}
          />
        </section>
      ))}
    </div>
  );
}

function TierTable({
  tiers,
  mood,
  step,
}: Readonly<{ tiers: readonly (readonly Effect[])[]; mood: number; step: number }>) {
  const first = tiers[0];
  if (!first) return null;
  return (
    <table className="effect-tiers">
      {first.some((item) => item.kind === 'amplify' && item.members) && (
        <caption>
          {first
            .flatMap((item) =>
              item.kind === 'amplify' && item.members ? [targetNames(item.members)] : [],
            )
            .join('・')}
          を増幅する
        </caption>
      )}
      <thead>
        <tr>
          <th scope="col">熱気Lv.</th>
          {first.map((effect, index) => (
            <th scope="col" key={index}>
              {columnTitle(effect)}
              {'moodBonus' in effect && effect.moodBonus && mood === 0 && (
                <span>
                  空模様0%／
                  {effect.moodBonus.target === 1 ? '+' : effect.moodBonus.target === 2 ? '±' : '−'}
                  100%
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tiers.map((tier, index) => (
          <tr key={index}>
            <th scope="row">
              {index * step}
              {index === tiers.length - 1 ? '以上' : '–' + (index * step + step - 1)}
            </th>
            {tier.map((effect, effectIndex) => (
              <td key={effectIndex}>
                {effectValue(effect, mood)}
                {'moodBonus' in effect && effect.moodBonus && mood === 0 && (
                  <>／{effectValue(effect, effect.moodBonus.target === 1 ? 100 : -100)}</>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function columnTitle(effect: Effect): string {
  switch (effect.kind) {
    case 'excitement':
      return '熱気Pt.';
    case 'beat-hearts':
      return '自然発生回数';
    case 'hearts':
      return 'きらめき';
    case 'heart-limit':
      return '出現上限';
    case 'boost':
      return 'STAR増加';
    case 'amplify':
      return '効果増幅';
    default:
      return '効果';
  }
}

function effectValue(effect: Effect, mood: number): string {
  let value: number;
  let unit = '';
  switch (effect.kind) {
    case 'excitement':
    case 'beat-hearts':
    case 'hearts':
    case 'heart-limit':
      value = effect.amount;
      break;
    case 'amplify':
      value = effect.percent;
      unit = '%';
      break;
    case 'boost':
      value = Math.round((effect.multiplier - 1) * 100);
      unit = '%';
      break;
    default:
      return describeEffect(effect);
  }
  if ('moodBonus' in effect && effect.moodBonus)
    value += calculateSkillMoodCorrection(effect.moodBonus.target, mood, effect.moodBonus.perPoint);
  return value.toLocaleString('ja-JP', { maximumFractionDigits: 3 }) + unit;
}
