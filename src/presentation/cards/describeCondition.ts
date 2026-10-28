import type { GameCondition } from '@akaakuhub/suku-sute-core/game/conditions/model';
import { formatNumber } from '../score/formatNumber';

export function describeCondition(condition: GameCondition): string {
  switch (condition.kind) {
    case 'always':
      return '常に成立';
    case 'mental-at-most':
      return `元気が${formatNumber(condition.fraction * 100)}%以下`;
    case 'mood-at-most':
      return `気分値が${formatNumber(condition.value)}以下`;
    case 'mood-at-least':
      return `気分値が${formatNumber(condition.value)}以上`;
    case 'mood-equal':
      return `気分値が${formatNumber(Math.trunc(condition.value))}と一致`;
    case 'voltage-level-at-most':
      return `熱気が${formatNumber(condition.level)}段階以下`;
    case 'part-at-most':
      return `パート${condition.number}まで`;
    case 'relative-part':
      return condition.number === 99 ? '山場' : `パート${condition.number}`;
    case 'heat':
      return `熱気が${formatNumber(condition.minimum)}段階以上`;
    case 'mental':
      return `元気が${formatNumber(condition.minimumPercent)}%以上`;
    case 'weather':
      return `空模様が${formatNumber(condition.minimum)}%以上`;
    case 'part-from':
      return `パート${condition.number}以降`;
    case 'part':
      return condition.number === 99 ? '山場' : `パート${condition.number}`;
    case 'cards':
    case 'card-count-parity': {
      const zones = { all: '編成', draw: '山札', discard: '捨て札', excluded: '除外済みのカード' };
      if (condition.kind === 'card-count-parity')
        return `${zones[condition.zone]}が${condition.parity === 'even' ? '偶数' : '奇数'}枚`;
      return `${zones[condition.zone]}が${formatNumber(condition.minimum)}枚以上`;
    }
    case 'token-series':
      return `対象の系列の追加カードが${formatNumber(condition.minimum)}枚以上`;
    case 'support-level':
      return `対象メンバーのサポート値の合計が${formatNumber(condition.minimum)}以上`;
    case 'natural-stars':
      return `自然発生するきらめきが${formatNumber(condition.minimum)}個以上`;
    case 'weather-type':
      return `空模様が${condition.weather === 'sun' ? '晴れ' : condition.weather === 'rain' ? '雨' : 'くもり'}`;
  }
}
