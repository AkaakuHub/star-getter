import type { Card } from '../../domain/game/model';
import { costumePalettes } from './appearance';
import { Mascot } from './Mascot';

export function CardArtwork({ card }: Readonly<{ card: Card }>) {
  const palette = costumePalettes[card.costume];
  return (
    <span
      className={'card-illustration motif-' + palette.motif}
      style={{
        '--costume-paper': palette.paper,
        '--costume-fabric': palette.fabric,
        '--costume-trim': palette.trim,
      }}
      aria-hidden="true"
    >
      <span className="costume-motif" />
      <Mascot performer={card.performer} costume={card.costume} />
    </span>
  );
}
