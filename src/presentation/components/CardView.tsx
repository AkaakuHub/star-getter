import { Check, Zap } from 'lucide-preact';
import { performers } from '../../content/performers';
import type { Card } from '../../domain/game/model';
import { describeCard, describeEffect } from '../cardDescription';
import { Portrait } from './Portrait';

export function CardView({
  card,
  selected,
  disabled,
  onClick,
}: Readonly<{
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      className={`skill-card color-${card.performer}`}
      aria-label={`${performers[card.performer].name}、${card.name}、エネルギー${card.cost}、${describeCard(card)}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="card-art">
        <Portrait performer={card.performer} />
        <span className="cost">
          <Zap size={14} aria-hidden="true" />
          {card.cost}
        </span>
        {selected && (
          <span className="card-selected">
            <Check size={16} aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="card-name">{card.name}</span>
      <span className="card-effects">
        {card.effects.map((effect) => (
          <span key={effect.kind}>{describeEffect(effect)}</span>
        ))}
      </span>
    </button>
  );
}
