import { scoreUnits } from './score/units';
import { describeAbilities } from './cards/describeAbilities';
import { describeEffect } from './cards/describeEffect';
import type { Card } from '../domain/game/model';
import { targetNames } from './cards/targetNames';

export function describeCard(card: Card): string {
  return card.effects.map(describeEffect).join('') + describeCardTraits(card).join('');
}

export function describeCardTraits(card: Card): readonly string[] {
  const traits = describeAbilities(card)
    .split('。')
    .filter(Boolean)
    .map((sentence) => sentence + '。');
  if (card.passive?.heartsPercent)
    traits.push(
      `手札にある間、きらめき獲得数を+${card.passive.heartsPercent}%し、手札上限を${Math.abs(card.passive.handLimitDelta ?? 0)}枚減少する。`,
    );
  if (card.relay)
    traits.push(
      `手札にある間、累計${card.relay.threshold.toLocaleString('ja-JP')}個を回収したとき、${card.relay.beats ? '自然発生' : 'きらめきを'}${card.relay.hearts.toLocaleString('ja-JP')}${card.relay.beats ? '回分のきらめき' : '個'}を獲得する。この特性は再ドローで再発動できる。`,
    );
  if (card.passive?.skillBoost)
    traits.push(
      `手札にある間、${targetNames(card.passive.skillBoost.members)}のアクション効果を+${card.passive.skillBoost.percent}%増幅する。`,
    );
  return traits;
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function formatScore(score: bigint | number): string {
  const value = typeof score === 'bigint' ? score : BigInt(Math.floor(score));
  if (value < 10000n) return value.toLocaleString('ja-JP');
  const index = Math.min(scoreUnits.length - 1, Math.floor((value.toString().length - 1) / 4));
  const divisor = 10n ** BigInt(index * 4);
  const main = value / divisor;
  const lower = ((value % divisor) * 10000n) / divisor;
  return `${main}${scoreUnits[index]}${lower > 0n ? `${lower}${scoreUnits[index - 1]}` : ''}`;
}
