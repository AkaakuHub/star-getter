import type { Card } from '../../domain/game/model';
import { costumePalettes } from './appearance';
import { Mascot } from './Mascot';
import { TokenArtwork } from './TokenArtwork';

export function CardArtwork({ card }: Readonly<{ card: Card }>) {
  if (card.token) return <TokenArtwork kind={card.token} />;
  const palette = costumePalettes[card.costume];
  return (
    <span
      className={'card-illustration scene-' + card.costume + ' card-' + card.id}
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
