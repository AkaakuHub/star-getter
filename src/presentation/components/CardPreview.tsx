import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { describeCard } from '../cardDescription';
import { liveLayout } from '../live/layout';
import { FittedText } from '../text/FittedText';

export function CardPreview({ card }: Readonly<{ card: Card | null }>) {
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
    </section>
  );
}
