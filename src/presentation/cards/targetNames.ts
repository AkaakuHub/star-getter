import { baseCards } from '../../content/baseCards';
import type { HandUseTrigger } from '../../domain/game/cards/cardTypes';

export function targetNames(members: readonly number[]): string {
  return baseCards
    .filter((card) => members.includes(card.member))
    .map((card) => card.name)
    .join('・');
}

function unitCardNames(unit: number): string {
  return baseCards
    .filter((card) => card.unit === unit)
    .map((card) => card.name)
    .join('・');
}

export function handUseTriggerDescription(trigger: HandUseTrigger): string {
  switch (trigger.kind) {
    case 'member':
      return `${targetNames([trigger.member])}のスキルを使用したとき`;
    case 'skill-icon':
      return `スキル記号${trigger.icon}を使用したとき`;
    case 'unit':
      return `${unitCardNames(trigger.unit)}を使用したとき`;
    case 'heart-quantity-count':
      return `${trigger.count}個のハートを回収したとき`;
    case 'same-card':
      return 'このカードのスキルを使用したとき';
    case 'any-skill':
      return 'スキルを使用したとき';
    case 'voltage-increase':
      return '熱気段階が上がったとき';
    case 'section-change':
      return 'パートが変わったとき';
  }
}
