import type { Card } from '../../domain/game/model';
import { describeCard } from '../cardDescription';
import { CardArtwork } from '../mascots/CardArtwork';

export function CardPerformance({ card, cost }: Readonly<{ card: Card; cost: number }>) {
  return (
    <div className="card-performance">
      <div className={'card-performance-art color-' + card.performer}>
        <CardArtwork card={card} />
      </div>
      <dl className="card-performance-stats">
        <div>
          <dt>エナジー</dt>
          <dd>{cost}</dd>
        </div>
        <div>
          <dt>輝き</dt>
          <dd>{card.appeal.smile}</dd>
        </div>
        <div>
          <dt>透明感</dt>
          <dd>{card.appeal.pure}</dd>
        </div>
        <div>
          <dt>落ち着き</dt>
          <dd>{card.appeal.cool}</dd>
        </div>
      </dl>
      <p className="card-performance-effect">{describeCard(card)}</p>
    </div>
  );
}
