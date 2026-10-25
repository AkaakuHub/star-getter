import { tokenNames } from '../../content/labels/tokens';
import type { Effect } from '../../domain/game/model';
import { targetNames } from './targetNames';

export const effectConditions = {
  happy100: '空模様が+100%（晴れ）',
  mellow100: '空模様が−100%（雨）',
  deck80: '編成が80枚以上',
  'first-section': '最初のパート',
  'last-section': '最後のパート',
} as const;

export function describeEffect(effect: Effect): string {
  switch (effect.kind) {
    case 'tokens': {
      return `「${tokenNames[effect.token]}」を${effect.count}枚、山札に追加する。${effect.token === 'ensemble' ? '追加されたカードは使用後に捨札へ戻る。' : effect.token === 'shadow' ? '追加されたカードは14回使用後に除外される。' : '追加されたカードは使用後に除外される。'}`;
    }
    case 'hand-limit':
      return `このパート中、手札上限を${effect.amount}枚増加する（最大8枚）。`;
    case 'heart-limit':
      return `このステージ中、きらめき上限を${effect.amount}個増加する。`;
    case 'search-unit':
      return `次の${effect.count}回、対象の編成のカードを優先して引く。`;
    case 'shuffle':
      return '手札を山札・捨札と混ぜて引き直す。';
    case 'use-hand':
      return '他の手札のアクションを一斉に使用する。必要エナジーは他の手札の合計からデッキ枚数に応じた値を引いて決まる。';
    case 'mood':
      return `このパート中、空模様を${effect.amount < 0 ? '雨' : '晴れ'}方向へ${Math.abs(effect.amount)}%変化させる。`;
    case 'conditional':
      return `${effectConditions[effect.condition]}のとき、${effect.effects.map(describeEffect).join('')}`;
    case 'voltage-tier':
      return `熱気Lv.${effect.step}ごとに効果が変化する。${effect.tiers.map((tier, index) => `Lv.${index * effect.step}以上：${tier.map(describeEffect).join('')}`).join('')}`;
    case 'energy-limit':
      return `このステージ中、エナジー上限を${effect.amount}増加する。`;
    case 'reset-special':
      return '対応する共鳴を再使用できるようにする。';
    case 'ap-speed':
      return `${effect.duration === 'stage' ? 'このステージ' : 'このパート'}中、エナジー回復速度を${effect.percent > 0 ? '+' : ''}${effect.percent}%変化させる。`;
    case 'set-energy':
      return `エナジーを${effect.amount}にする。`;
    case 'mental-shield':
      return `このステージ中、最大元気の${effect.amount}%ぶんの直接ダメージを防ぐ。`;
    case 'cost-reduction':
      return `対象カードの消費エナジーを${effect.amount}減少させる。`;
    case 'protect-mental':
      return 'このステージ中、元気が0でも休憩に入らない。';
    case 'voltage-set':
      return `熱気を${effect.amount.toLocaleString('ja-JP')}にする。`;
    case 'voltage-limit':
      return `熱気Lv.上限を${effect.amount}増加する。`;
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
      return `このステージ中、獲得するSTARを${Math.round((effect.multiplier - 1) * 100)}%増加させる。この効果は重複し、効果増幅の対象となる。`;
    case 'amplify':
      return `${effect.duration === 'section' ? 'このパート' : 'このステージ'}中、${effect.members ? targetNames(effect.members) + 'の' : '全ての'}アクションの効果量を${effect.percent}%増幅する。増幅率は加算して適用する。`;
    case 'bloom':
      return '空模様が−100%のときに使用できる。このステージ中、開花を発動し、きらめきを結晶に変化させる。エナジー・熱気・元気の増減を開花プログレスに変換し、プログレスの1.5乗に応じて回収時のSTARが増加する。発動時のゲージを保持し、開花中はエナジー残量に関係なくアクションを使用できる。';
    case 'resource-boost':
      return `${effect.condition === 'always' ? '' : effect.condition === 'voltage20' ? '熱気Lv.が20以上のとき、' : '元気が100%のとき、'}${effect.uses === null ? 'このステージ中、' : `${effect.uses}回の間、`}${effect.target === 'excitement' ? '熱気ゲイン' : '元気リカバー'}効果を${effect.percent}%増幅する。`;
    case 'collect':
      return '出現中のきらめきを全て回収する。';
  }
}
