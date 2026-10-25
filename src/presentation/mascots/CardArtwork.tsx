import type { Card } from '../../domain/game/model';
import { costumePalettes } from './appearance';
import { Mascot } from './Mascot';

export function CardArtwork({ card }: Readonly<{ card: Card }>) {
  const palette = costumePalettes[card.costume];
  return (
    <span
      className={'card-illustration scene-' + (card.token ?? card.costume)}
      style={{
        '--scene-paper': palette.paper,
        '--scene-dark': palette.fabric,
        '--scene-light': palette.trim,
      }}
      aria-hidden="true"
    >
      <span className="card-scenery">
        <span />
        <span />
        <span />
      </span>
      <Mascot performer={card.performer} />
    </span>
  );
}
