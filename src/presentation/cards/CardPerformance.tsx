import type { Card } from '../../domain/game/model';
import { describeCardTraits } from '../cardDescription';
import { CardArtwork } from '../mascots/CardArtwork';
import { EffectDetails } from './EffectDetails';

export function CardPerformance({ card, cost }: Readonly<{ card: Card; cost: number }>) {
  const traits = describeCardTraits(card);
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
      <div className="card-performance-effect">
        <section>
          <h3>アクション</h3>
          <EffectDetails effects={card.effects} />
        </section>
        {traits.length > 0 && (
          <section>
            <h3>特性</h3>
            <ul className="card-traits">
              {traits.map((trait) => (
                <li key={trait}>{trait}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
