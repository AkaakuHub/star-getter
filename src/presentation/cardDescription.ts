import type { Card, Effect } from '../domain/game/model';

export function describeEffect(effect: Effect): string {
  switch (effect.kind) {
    case 'hearts':
      return `ハート+${effect.amount}`;
    case 'energy':
      return `エネルギー+${effect.amount}`;
    case 'stamina':
      return `スタミナ+${effect.amount}`;
    case 'excitement':
      return `熱気+${effect.amount}`;
    case 'boost':
      return `得点×${effect.multiplier}・${effect.seconds}秒`;
    case 'collect':
      return 'ハートを回収';
  }
}

export function describeCard(card: Card): string {
  return card.effects.map(describeEffect).join('、');
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

const scoreFormatter = new Intl.NumberFormat('ja-JP');

export function formatScore(score: number): string {
  return scoreFormatter.format(score);
}
