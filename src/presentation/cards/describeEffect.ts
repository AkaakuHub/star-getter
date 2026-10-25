import { describeCondition } from './describeCondition';
import { tokenNames } from '../../content/labels/tokens';
import type { Effect } from '../../domain/game/model';
import { targetNames } from './targetNames';

export const effectConditions = {
  happy100: '空模様が+100%（晴れ）',
  mental0: '元気が0%（開花中も成立）',
  mellow100: '空模様が−100%（雨）',
  deck80: '編成が80枚以上',
  'first-section': '最初のパート',
  'last-section': '最後のパート',
} as const;

export function describeEffect(effect: Effect): string {
  switch (effect.kind) {
    case 'branch':
      return `${describeCondition(effect.condition)}のとき、${effect.whenTrue.map(describeEffect).join('')}${effect.whenFalse.length ? 'それ以外のとき、' + effect.whenFalse.map(describeEffect).join('') : ''}`;
    case 'mode':
      return `モード${effect.modeId}を${effect.change === 'on' ? 'オン' : effect.change === 'off' ? 'オフ' : '反転'}にする。`;
    case 'mode-reaction':
      return `モード${effect.modeId}がオンになるたびに回数を数え、${effect.thresholds.join('・')}回ごとに効果を発動する。`;
    case 'skill-boost':
      return '対象カードのスキル効果を増幅する。';
    case 'love-up-additional-buff':
      return '対象カードのSTAR増加を増幅する。';

    case 'tokens': {
      return `「${tokenNames[effect.token]}」を${effect.count}枚、山札に追加する。${effect.token === 'shadow' ? '追加されたカードは14回使用後に除外される。' : '追加されたカードは使用後に除外される。'}`;
    }
    case 'token-card':
      return `指定カードを${effect.count}枚、山札に追加する。`;
    case 'token-boost':
      return `追加カードの生成枚数を${effect.calculation === 'add' ? '加算' : '割合増幅'}する。`;
    case 'hand-limit':
      return `このパート中、手札上限を${effect.amount}枚増加する（最大8枚）。`;
    case 'proxy-skill':
      return 'Proxyスキルを発動する。';
    case 'proxy-skill-forced-activation':
      return '対象のProxyスキルを強制発動する。';
    case 'heart-limit':
      return `このステージ中、きらめき上限を${effect.amount}個増加する。`;
    case 'search-token':
      return `次の${effect.count}回、「${tokenNames[effect.token]}」を優先して引く。`;
    case 'search-unit':
      return `次の${effect.count}回、対象の編成のカードを優先して引く。`;
    case 'search':
      return `次の${effect.count}回、指定されたカードを優先して引く。`;
    case 'shuffle':
      return '手札を山札・捨札と混ぜて引き直す。';
    case 'use-hand':
      return '他の手札のアクションを一斉に使用する。';
    case 'card-move':
      return effect.destination === 'deck'
        ? '使用後、発動元カードを山札へ戻す。'
        : '使用後、発動元カードを除外する。';
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
    case 'ap-speed-change':
      return 'エナジーの回復速度を変化させる。';
    case 'voltage-convert':
      return '熱気の増加を別の効果に変換する。';
    case 'mental-heart-induce':
      return '元気が変化するたび、きらめきを生成する。';
    case 'combo-induce':
      return '対象メンバーがアクションを使用したとき、合計APに応じた効果を発動する。';
    case 'heart-limit-change':
      return 'きらめき上限を変更する。';
    case 'additional-heart-induce':
      return '条件に一致したアクションの使用後、追加のきらめきを生成する。';
    case 'mental-shield':
      return `このステージ中、最大元気の${effect.amount}%ぶんの直接ダメージを防ぐ。`;
    case 'cost-reduction':
      return `対象カードの消費エナジーを${effect.amount}減少させる。`;
    case 'skill-cost-change':
      return '条件に応じて発動元カードの消費エナジーを変化させる。';
    case 'deck-skill-cost-change':
      return '対象カードの次回消費エナジーを変化させる。';
    case 'parameter-value-change':
      return '指定されたカード効果の詳細値を変化させる。';
    case 'protect-mental':
      return `${effect.duration === 'section' ? 'このパート' : 'このステージ'}中、元気が0でも休憩に入らない。`;
    case 'beat-count':
      return `このパート中、自然発生するきらめきを${effect.amount}個増加する。`;
    case 'beat-point-buff':
      return `自然発生するきらめきのビートポイントを${effect.amount}増加する。`;
    case 'heart-boost':
      return `次の${effect.uses}回のきらめき獲得効果を${effect.percent}%増幅する。`;
    case 'voltage-set':
      return `熱気を${effect.amount.toLocaleString('ja-JP')}にする。`;
    case 'stop-voltage-increase':
      return effect.duration.kind === 'milliseconds'
        ? `${effect.duration.value}ミリ秒間、熱気の自然増加を停止する。`
        : `${effect.duration.value}パートの間、熱気の自然増加を停止する。`;
    case 'infinity-gauge':
      return `${effect.gauge === 'ap' ? 'エナジー' : effect.gauge === 'mental' ? '元気' : '熱気'}ゲージを無限にする。`;
    case 'gauge-regeneration':
      return `${effect.gauge === 'mental' ? '元気' : '熱気'}を一定間隔で回復する。`;
    case 'mental-barrier':
      return effect.barrier === 'endurance'
        ? '元気の減少を耐久値まで防ぐ。'
        : '元気の減少を緩和する。';
    case 'voltage-limit':
      return `熱気Lv.上限を${effect.amount}増加する。`;
    case 'beat-hearts':
      return `自然発生${effect.amount}回分のきらめきを獲得する。`;
    case 'hearts':
      return `きらめきを${effect.amount}個獲得する。`;
    case 'energy':
      return `エナジーを${Math.abs(effect.amount)}${effect.amount < 0 ? '減らす' : '回復する'}。開花中は回復量と効果増幅に応じて開花プログレスを増加させる。`;
    case 'stamina':
      return `元気を${effect.amount}%回復する。開花中は回復効果を開花プログレスへ変換する。`;
    case 'excitement':
      return `熱気Pt.を${effect.amount}獲得する。開花中は獲得効果を開花プログレスへ変換する。`;
    case 'boost':
      return `このステージ中、獲得するSTARを${Math.round((effect.multiplier - 1) * 100)}%増加させる。この効果は重複し、効果増幅の対象となる。`;
    case 'amplify':
      return `${effect.duration === 'section' ? 'このパート' : 'このステージ'}中、${effect.members ? targetNames(effect.members) + 'の' : '全ての'}アクションの効果量を${effect.percent}%増幅する。増幅率は加算して適用する。`;
    case 'skill-cooldown':
      return 'このステージ中、曲の長さに応じてアクション間隔を変更する。';
    case 'bloom':
      return 'このステージ中、開花を発動し、きらめきを結晶に変化させる。エナジー・熱気・元気の増減を開花プログレスに変換し、プログレスの1.5乗に応じて回収時のSTARが増加する。発動時のゲージを保持し、開花中はエナジー残量に関係なくアクションを使用できる。使用時のエナジー消費もプログレスへ変換する。';
    case 'resource-boost':
      return `${effect.condition === 'always' ? '' : effect.condition === 'voltage20' ? '熱気Lv.が20以上のとき、' : '元気が100%のとき、'}${effect.uses === null ? 'このステージ中、' : `${effect.uses}回の間、`}${effect.target === 'excitement' ? '熱気ゲイン' : effect.target === 'attract' ? 'STAR増加' : '元気リカバー'}効果を${effect.percent}%増幅する。`;
    case 'collect':
      return '出現中のきらめきを全て回収する。';
  }
}
