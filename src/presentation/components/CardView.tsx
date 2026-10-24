import { Check } from 'lucide-preact';
import { performers } from '../../content/performers';
import type { Card } from '../../domain/game/model';
import { describeCard } from '../cardDescription';
import { FittedText } from '../text/FittedText';

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
      className={'skill-card color-' + card.performer}
      aria-label={
        performers[card.performer].name +
        '、' +
        card.name +
        '、AP' +
        card.cost +
        '、' +
        describeCard(card)
      }
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="card-art">
        <img src={card.art} alt="" loading="lazy" draggable={false} />
        <span className="cost">{card.cost}</span>
        {selected && (
          <span className="card-selected">
            <Check size={16} aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="card-name">{card.name}</span>
      <span className="card-effects">
        <FittedText text={describeCard(card)} />
      </span>
    </button>
  );
}
