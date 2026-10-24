import type { Card, Effect } from '../domain/game/model';

function describeEffect(effect: Effect): string {
  switch (effect.kind) {
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
    case 'bloom':
      return 'このステージ中、開花を発動し、ハートをフラワーに変化させる。AP・ボルテージ・メンタルの増減を開花プログレスに変換し、プログレスの1.5乗に応じて回収時のLOVEが増加する。発動時のゲージを保持し、開花中はAP残量に関係なくスキルを使用できる。';
    case 'resource-boost':
      return `${effect.condition === 'voltage20' ? 'ボルテージLv.が20以上' : 'メンタルが100%以上'}のとき、${effect.uses}回の間、${effect.target === 'excitement' ? 'ボルテージゲイン' : 'メンタルリカバー'}効果を${effect.percent}%増幅する。`;
    case 'collect':
      return '出現中のハートを全て回収する。';
  }
}

export function describeCard(card: Card): string {
  const skill = card.effects.map(describeEffect).join('');
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

export function formatFactor(percent: bigint): string {
  const whole = percent / 100n;
  if (whole >= 10000n) return formatScore(whole);
  const fraction = percent % 100n;
  return (
    whole + (fraction > 0n ? '.' + fraction.toString().padStart(2, '0').replace(/0$/, '') : '')
  );
}
