import type { GameCondition } from '../../domain/game/conditions/model';
import { formatNumber } from '../score/formatNumber';

export function describeCondition(condition: GameCondition): string {
  switch (condition.kind) {
    case 'heat':
      return `熱気が${formatNumber(condition.minimum)}段階以上`;
    case 'stamina':
      return `元気が${formatNumber(condition.minimumPercent)}%以上`;
    case 'weather':
      return `空模様が${formatNumber(condition.minimum)}%以上`;
    case 'part-from':
      return `パート${condition.number}以降`;
    case 'part':
      return condition.number === 99 ? '山場' : `パート${condition.number}`;
    case 'cards': {
      const zones = { all: '編成', draw: '山札', discard: '捨て札', excluded: '除外済みのカード' };
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
