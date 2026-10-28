import { Flag, LifeBuoy, Puzzle, Sailboat, Shell, ShipWheel } from 'lucide-preact';

const tokenSymbols = new Map(
  Object.entries({
    ensemble: Sailboat,
    story: Shell,
    clock: ShipWheel,
    bookmark: LifeBuoy,
    shadow: Puzzle,
    pennant: Flag,
  }),
);

export function TokenArtwork({ kind }: Readonly<{ kind: string }>) {
  const Symbol = tokenSymbols.get(kind);
  if (!Symbol) throw new Error('追加カードのアイコンがありません。');
  return (
    <span className={'card-illustration token-artwork token-' + kind} aria-hidden="true">
      <Symbol className="token-artwork-symbol" strokeWidth={1.6} />
    </span>
  );
}
