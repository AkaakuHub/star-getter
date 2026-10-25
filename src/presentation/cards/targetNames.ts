import { baseCards } from '../../content/baseCards';

export function targetNames(members: readonly number[]): string {
  return baseCards
    .filter((card) => members.includes(card.member))
    .map((card) => card.name)
    .join('・');
}
