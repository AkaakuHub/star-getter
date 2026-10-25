import { BookOpen, Bookmark, Clock3, Ghost, Tickets } from 'lucide-preact';

const tokenSymbols = {
  ensemble: Tickets,
  story: BookOpen,
  clock: Clock3,
  bookmark: Bookmark,
  shadow: Ghost,
} as const;

export function TokenArtwork({ kind }: Readonly<{ kind: keyof typeof tokenSymbols }>) {
  const Symbol = tokenSymbols[kind];
  return (
    <span className={'card-illustration token-artwork token-' + kind} aria-hidden="true">
      <Symbol className="token-artwork-symbol" strokeWidth={1.6} />
    </span>
  );
}
