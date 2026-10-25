import { LifeBuoy, Puzzle, Sailboat, Shell, ShipWheel } from 'lucide-preact';

const tokenSymbols = {
  ensemble: Sailboat,
  story: Shell,
  clock: ShipWheel,
  bookmark: LifeBuoy,
  shadow: Puzzle,
} as const;

export function TokenArtwork({ kind }: Readonly<{ kind: keyof typeof tokenSymbols }>) {
  const Symbol = tokenSymbols[kind];
  return (
    <span className={'card-illustration token-artwork token-' + kind} aria-hidden="true">
      <Symbol className="token-artwork-symbol" strokeWidth={1.6} />
    </span>
  );
}
