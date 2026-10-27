import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { CardArtwork } from '../mascots/CardArtwork';

export function HandCardFace({ card, cost }: Readonly<{ card: Card; cost: number }>) {
  return (
    <>
      <CardArtwork card={card} />
      <span className="hand-cost">{cost}</span>
      <span className="hand-name">{card.name}</span>
    </>
  );
}
