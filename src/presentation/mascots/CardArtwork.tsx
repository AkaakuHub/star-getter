import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { costumePalettes } from './appearance';
import { Mascot } from './Mascot';
import { TokenArtwork } from './TokenArtwork';

export function CardArtwork({ card }: Readonly<{ card: Card }>) {
  if (card.token) return <TokenArtwork kind={card.token} />;
  if (card.tokenCard)
    return (
      <span
        className="token-card-art"
        data-mood={card.mood}
        data-style={card.styleType}
        aria-hidden="true"
      />
    );
  if (card.costume === null || card.performer === null)
    throw new Error('カードの表示データがありません。');
  const palette = costumePalettes[card.costume];
  return (
    <span
      className={'card-illustration scene-' + card.costume + ' card-' + card.cardInstanceId}
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
