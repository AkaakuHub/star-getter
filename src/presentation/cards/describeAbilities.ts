import { describeEffect } from './describeEffect';
import type { Card } from '../../domain/game/model';

export function describeAbilities(card: Card): string {
  let text = card.drawEffects ? `引いたとき、${card.drawEffects.map(describeEffect).join('')}` : '';
  if (card.collectionEffects)
    text += `手札にある間、累計${card.collectionEffects.threshold.toLocaleString('ja-JP')}個を回収したとき、${card.collectionEffects.effects.map(describeEffect).join('')}この特性は引き直すと再び使用できる。`;
  if (card.useEffects) text += `使用後、${card.useEffects.map(describeEffect).join('')}`;
  if (card.handUse)
    text += `手札にある間、対応する雨の基本カードを使用したとき、${card.handUse.effects.map(describeEffect).join('')}`;
  if (card.collectionAbility === 'icy-kosuzu')
    text +=
      '手札にある間に累計50万個回収時、熱気950段階以上かつ元気0%なら手札を引き直し、雨音の反響・凍空の鼓動・雨の準備を次の4回優先して引く。熱気を140万減らし、1000段階以上ならさらに1400万減らす。';
  switch (card.drawAbility) {
    case 'library':
      text +=
        '引いたとき、編成枚数に応じて潮の便り・港の待ち合わせ・船出の合図・追い風とうなばらの追加カードのエナジー消費を2〜20減少させる。';
      break;
    case 'clock':
      text +=
        '引いたとき、このパート中、編成枚数に応じてエナジー回復間隔を5〜80%短縮する。80枚以上で引いたとき、貝がらの効果をこのライブ中+1001%増幅する。';
      break;
    case 'bookmark':
      text +=
        '引いたとき、編成枚数に応じてエナジーを1〜8回復する。80枚以上で手札にある間、貝がらの効果を+1001%増幅する。手札にある間に累計50万個を回収したとき、編成95枚以上で手札を引き直す。';
      break;
    case 'story':
      text +=
        '引いたとき、編成枚数に応じて自然発生20〜200回分のきらめきを獲得する。80枚以上で手札にある間、貝がらの効果を+1001%増幅する。手札にある間に累計50万個を回収したとき、編成95枚以上で自然発生1001回分のきらめきを獲得する。';
      break;
    case 'camera':
      text +=
        '潮の便り・空のはじまり使用後だけ山札から引くことができる。引いたとき、すべてのカードの消費を2、潮の便り・空のはじまりの消費をさらに4減少させる。';
      break;
    case 'perennial':
      text += '引いたとき、潮の便り・空のはじまり・雨音の反響の消費を5減少させる。';
      break;
    case 'genesis':
      text +=
        '引いたとき、このパート中、エナジー回復間隔が10%長くなり、熱気を100、元気を10%減らす。空模様の振れ幅に応じて減少量が増える。';
      break;
    case 'shadow':
      text +=
        '雨音の反響・凍空の鼓動使用後だけ山札から引くことができる。引いたとき、元気を14%減らし、このパート中、エナジー回復間隔を14%延長して手札上限を1減らす。';
      break;
  }
  switch (card.useAbility) {
    case 'story-boost':
      text += '使用後、編成枚数に応じて貝がらの効果をこのライブ中+100〜1001%増幅する。';
      break;
    case 'class':
      text += '3回使用後、このカードを除外し、通常の共鳴を再使用可能にする。';
      break;
    case 'icy-sayaka':
      text +=
        '初回使用後、パズルを1枚追加する。累計50万個回収時、熱気950段階以上かつ元気0%なら手札を引き直して熱気を140万減らす。1000段階以上ならさらに1400万減らす。';
      break;
    case 'shadow':
      text +=
        '14回使用後、このカードを除外し、このライブ中、元気が0%でも休憩しない。元気を1000%減らし、熱気を655000001に変更する。';
      break;
  }
  if (
    card.drawRules?.some(
      (rule) =>
        rule.condition.kind === 'unit' &&
        rule.condition.value === 1 &&
        rule.negated &&
        rule.weight === 0,
    )
  )
    text +=
      '潮の便り・空のはじまり・港の待ち合わせ・船出の合図・追い風使用後だけ山札から引くことができる。';
  if (
    card.drawRules?.some(
      (rule) =>
        rule.condition.kind === 'unit' &&
        rule.condition.value === 2 &&
        rule.negated &&
        rule.weight === 0,
    ) &&
    card.token !== 'shadow'
  )
    text += '雨音の反響・凍空の鼓動使用後だけ山札から引くことができる。';
  if (
    card.token === 'story' ||
    card.token === 'clock' ||
    card.token === 'bookmark' ||
    card.useAbility === 'story-boost'
  )
    text += '晴れ方向の空模様では、対応する効果量が増加する。';
  return text;
}
