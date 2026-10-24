import { X } from 'lucide-preact';
import type { Card } from '../../domain/game/model';
import { describeCard } from '../cardDescription';
import { liveLayout } from '../live/layout';
import { FittedText } from '../text/FittedText';

export function CardPreview({
  card,
  onClose,
}: Readonly<{ card: Card | null; onClose: () => void }>) {
  if (!card) return null;
  return (
    <section
      aria-label={card.name + 'の効果'}
      className="skill-preview"
      style={liveLayout.description}
    >
      <div className="skill-description">
        <FittedText text={describeCard(card)} />
      </div>
      <button type="button" className="skill-close" aria-label="効果表示を閉じる" onClick={onClose}>
        <X size={14} aria-hidden="true" />
      </button>
    </section>
  );
}
