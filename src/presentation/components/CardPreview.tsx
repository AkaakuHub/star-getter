import { X, Zap } from 'lucide-preact';
import type { GameController } from '../../app/gameController';
import { performers } from '../../content/performers';
import { canUseCard } from '../../domain/game/projection';
import { describeEffect } from '../cardDescription';

export function CardPreview({ controller }: Readonly<{ controller: GameController }>) {
  const card = controller.selectedCard;
  if (!card) return null;
  const index = controller.state.hand.indexOf(card.id);
  return (
    <section aria-label="選択中のスキル" className="skill-preview">
      <div className="relative flex gap-3">
        <img
          src={card.art}
          alt={performers[card.performer].name}
          className="w-[22cqw] shrink-0 self-start rounded-md border-2 border-[#353148] object-cover"
          draggable={false}
        />
        <div className="min-w-0 flex-1 pr-5">
          <h2 className="text-[3.6cqw] leading-6 font-bold">{card.name}</h2>
          <div className="mt-2 grid gap-2 text-[3cqw] leading-5 text-[#353148]">
            {card.effects.map((effect) => (
              <p key={effect.kind}>{describeEffect(effect)}</p>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="absolute -top-1 -right-1 grid size-9 place-items-center rounded-md bg-[#f3e7e7]"
          aria-label="スキル表示を閉じる"
          onClick={() => controller.clearSelection()}
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        className="button primary mt-3 w-full"
        disabled={!canUseCard(controller.state, index)}
        onClick={() => controller.activateSelected()}
      >
        <Zap size={16} aria-hidden="true" />
        発動 AP{card.cost}
      </button>
    </section>
  );
}
