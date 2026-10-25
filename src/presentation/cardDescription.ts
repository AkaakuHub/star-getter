import { scoreUnits } from './score/units';
import { describeAbilities } from './cards/describeAbilities';
import type { Card, Effect } from '../domain/game/model';

function describeEffect(effect: Effect): string {
  switch (effect.kind) {
    case 'tokens': {
      const names = {
        ensemble: '共演の招待',
        story: '花のページ',
        clock: '時を刻む合図',
        bookmark: '次の一幕',
      };
      return `「${names[effect.token]}」を${effect.count}枚、山札に追加する。追加されたカードは使用後に除外される。`;
    }
    case 'hand-limit':
      return `このパート中、手札上限を${effect.amount}枚増加する（最大8枚）。`;
    case 'heart-limit':
      return `このステージ中、きらめき上限を${effect.amount}個増加する。`;
    case 'shuffle':
      return '手札を山札・捨札と混ぜて引き直す。';
    case 'use-hand':
      return '他の手札のアクションを一斉に使用する。必要エナジーは他の手札の合計からデッキ枚数に応じた値を引いて決まり、このカードは使用後に除外される。';
    case 'mood':
      return `このパート中、空模様を晴れ方向へ${effect.amount}%変化させる。`;
    case 'conditional':
      return `空模様が晴れ100%のとき、${effect.effects.map(describeEffect).join('')}`;
    case 'beat-hearts':
      return `自然発生${effect.amount}回分のきらめきを獲得する。`;
    case 'hearts':
      return `きらめきを${effect.amount}個獲得する。`;
    case 'energy':
      return `エナジーを${effect.amount}回復する。開花中は回復量と効果増幅に応じて開花プログレスを増加させる。`;
    case 'stamina':
      return `元気を${effect.amount}%回復する。開花中は回復効果を開花プログレスへ変換する。`;
    case 'excitement':
      return `熱気Pt.を${effect.amount}獲得する。開花中は獲得効果を開花プログレスへ変換する。`;
    case 'boost':
      return `${effect.seconds}秒間、獲得するSTARを${Math.round((effect.multiplier - 1) * 100)}%増加させる。この効果は重複し、効果増幅の対象となる。`;
    case 'amplify':
      return `このステージ中、あらゆるアクションの効果量を${effect.percent}%増幅する。増幅率は加算して適用する。`;
    case 'bloom':
      return '空模様が−100%のときに使用できる。このステージ中、開花を発動し、きらめきを結晶に変化させる。エナジー・熱気・元気の増減を開花プログレスに変換し、プログレスの1.5乗に応じて回収時のSTARが増加する。発動時のゲージを保持し、開花中はエナジー残量に関係なくアクションを使用できる。';
    case 'resource-boost':
      return `${effect.condition === 'voltage20' ? '熱気Lv.が20以上' : '元気が100%'}のとき、${effect.uses}回の間、${effect.target === 'excitement' ? '熱気ゲイン' : '元気リカバー'}効果を${effect.percent}%増幅する。`;
    case 'collect':
      return '出現中のきらめきを全て回収する。';
  }
}

export function describeCard(card: Card): string {
  const skill =
    card.effects.map(describeEffect).join('') +
    describeAbilities(card) +
    (card.passive
      ? `手札にある間、きらめき獲得数を+${card.passive.heartsPercent}%し、手札上限を${Math.abs(card.passive.handLimitDelta)}枚減少する。`
      : '');
  return card.relay
    ? skill +
        `手札にある間、${card.relay.threshold}個以上を一度に回収したとき、${card.relay.beats ? '自然発生' : 'きらめきを'}${card.relay.hearts}${card.relay.beats ? '回分のきらめき' : '個'}を獲得する。この特性は再ドローで再発動できる。`
    : skill;
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function formatScore(score: bigint | number): string {
  const value = typeof score === 'bigint' ? score : BigInt(Math.floor(score));
  if (value < 10000n) return value.toLocaleString('ja-JP');
  const index = Math.min(scoreUnits.length - 1, Math.floor((value.toString().length - 1) / 4));
  const divisor = 10n ** BigInt(index * 4);
  const main = value / divisor;
  const lower = ((value % divisor) * 10000n) / divisor;
  return `${main}${scoreUnits[index]}${lower > 0n ? `${lower}${scoreUnits[index - 1]}` : ''}`;
}
