import type { Card } from '../../domain/game/model';

export function describeAbilities(card: Card): string {
  let text = '';
  switch (card.drawAbility) {
    case 'library':
      text +=
        '引いたとき、編成枚数に応じて対応する基本カードと追加カードのエナジー消費を2〜20減少させる。';
      break;
    case 'clock':
      text +=
        '引いたとき、このパート中、編成枚数に応じてエナジー回復間隔を5〜80%短縮する。80枚以上で引いたとき、花のページの効果をこのライブ中+1001%増幅する。';
      break;
    case 'bookmark':
      text +=
        '引いたとき、編成枚数に応じてエナジーを1〜8回復する。80枚以上で手札にある間、花のページの効果を+1001%増幅する。95枚以上で一度に50万個回収すると、手札を引き直す。';
      break;
    case 'story':
      text +=
        '引いたとき、編成枚数に応じて自然発生20〜200回分のきらめきを獲得する。80枚以上で手札にある間、花のページの効果を+1001%増幅する。95枚以上で一度に50万個回収すると、自然発生1001回分のきらめきを獲得する。';
      break;
  }
  if (card.useAbility === 'story-boost')
    text += '使用後、編成枚数に応じて花のページの効果をこのライブ中+100〜1001%増幅する。';
  if (
    card.token === 'story' ||
    card.token === 'clock' ||
    card.token === 'bookmark' ||
    card.useAbility
  )
    text += '晴れ方向の空模様では、対応する効果量がさらに増加する。';
  return text;
}
