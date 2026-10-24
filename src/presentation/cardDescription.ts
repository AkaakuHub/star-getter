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
      return `このセクション中、手札上限を${effect.amount}枚増加する（最大8枚）。`;
    case 'heart-limit':
      return `このステージ中、ハート上限を${effect.amount}個増加する。`;
    case 'shuffle':
      return '手札を山札・捨札と混ぜて引き直す。';
    case 'use-hand':
      return '他の手札のスキルを一斉に使用する。必要APは他の手札の合計からデッキ枚数に応じた値を引いて決まり、このカードは使用後に除外される。';
    case 'hearts':
      return `スキルハートを${effect.amount}個獲得する。`;
    case 'energy':
      return `APを${effect.amount}回復する。開花中は回復量と効果増幅に応じて開花プログレスを増加させる。`;
    case 'stamina':
      return `メンタルを${effect.amount}%回復する。開花中は回復効果を開花プログレスへ変換する。`;
    case 'excitement':
      return `ボルテージPt.を${effect.amount}獲得する。開花中は獲得効果を開花プログレスへ変換する。`;
    case 'boost':
      return `${effect.seconds}秒間、獲得するLOVEを${Math.round((effect.multiplier - 1) * 100)}%増加させる。この効果は重複し、効果増幅の対象となる。`;
    case 'amplify':
      return `このステージ中、あらゆるスキルの効果量を${effect.percent}%増幅する。増幅率は加算して適用する。`;
    case 'growth':
      return `このステージ中、LOVEの成長倍率を${formatScore(effect.multiplier)}倍にする。現在の成長倍率に乗算し、再使用するたびに複利で増える。`;
    case 'bloom':
      return 'ムードが−100%のときに使用できる。このステージ中、開花を発動し、ハートをフラワーに変化させる。AP・ボルテージ・メンタルの増減を開花プログレスに変換し、プログレスの1.5乗に応じて回収時のLOVEが増加する。発動時のゲージを保持し、開花中はAP残量に関係なくスキルを使用できる。';
    case 'resource-boost':
      return `${effect.condition === 'voltage20' ? 'ボルテージLv.が20以上' : 'メンタルが100%以上'}のとき、${effect.uses}回の間、${effect.target === 'excitement' ? 'ボルテージゲイン' : 'メンタルリカバー'}効果を${effect.percent}%増幅する。`;
    case 'collect':
      return '出現中のハートを全て回収する。';
  }
}

export function describeCard(card: Card): string {
  const skill =
    card.effects.map(describeEffect).join('') +
    (card.passive
      ? `手札にある間、スキルハート獲得数を+${card.passive.heartsPercent}%し、手札上限を${Math.abs(card.passive.handLimitDelta)}枚減少する。`
      : '');
  return card.relay
    ? skill +
        `手札にある間、${card.relay.threshold}個以上を一度に回収したとき、ハートを${card.relay.hearts}個獲得する。この特性は再ドローで再発動できる。`
    : skill;
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

const scoreUnits = [
  '',
  '万',
  '億',
  '兆',
  '京',
  '垓',
  '秭',
  '穣',
  '溝',
  '澗',
  '正',
  '載',
  '極',
  '恒河沙',
  '阿僧祇',
  '那由他',
  '不可思議',
  '無量大数',
];

export function formatScore(score: bigint | number): string {
  const value = typeof score === 'bigint' ? score : BigInt(Math.floor(score));
  if (value < 10000n) return value.toLocaleString('ja-JP');
  const index = Math.min(scoreUnits.length - 1, Math.floor((value.toString().length - 1) / 4));
  const divisor = 10n ** BigInt(index * 4);
  const main = value / divisor;
  const lower = ((value % divisor) * 10000n) / divisor;
  return `${main}${scoreUnits[index]}${lower > 0n ? `${lower}${scoreUnits[index - 1]}` : ''}`;
}
