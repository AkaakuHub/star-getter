import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { CardArtwork } from '../mascots/CardArtwork';

export function HandCardFace({ card, consumeAp }: Readonly<{ card: Card; consumeAp: number }>) {
  return (
    <>
      <CardArtwork card={card} />
      <span className="hand-cost">{consumeAp}</span>
      <span className="hand-name">{card.name}</span>
    </>
  );
}
