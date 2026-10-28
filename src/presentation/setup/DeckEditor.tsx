import { ArrowLeft, ArrowUp, ArrowDown, Check, Minus } from 'lucide-preact';
import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { baseCards } from '../../content/baseCards';
import { resolveDeck } from '../../content/cards';
import { moveSetupCard, toggleSetupCard, type GameSetup } from '../../app/setup/gameSetup';
import { HandCardFace } from '../cards/HandCardFace';

export function DeckEditor({
  setup,
  onChange,
  onBack,
  onCard,
}: Readonly<{
  setup: GameSetup;
  onChange: (setup: GameSetup) => void;
  onBack: () => void;
  onCard: (card: Card) => void;
}>) {
  return (
    <main className="setup-page">
      <header className="setup-heading">
        <h1>編成{setup.cardDatasIds.length}枚</h1>
        <button className="button quiet" type="button" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          戻る
        </button>
      </header>
      <ol className="setup-selected">
        {resolveDeck(setup.cardDatasIds).map((card, index) => (
          <li key={card.cardDatasId}>
            <button
              className={'card-browser-card color-' + card.performer}
              type="button"
              aria-label={card.name + 'の性能を確認'}
              onClick={() => onCard(card)}
            >
              <HandCardFace card={card} consumeAp={card.consumeAp} />
            </button>
            <span>{card.name}</span>
            <div className="setup-order">
              <button
                className="icon-button"
                type="button"
                disabled={index === 0}
                aria-label={card.name + 'を上へ'}
                onClick={() => onChange(moveSetupCard(setup, card.cardDatasId, -1))}
              >
                <ArrowUp size={18} aria-hidden="true" />
              </button>
              <button
                className="icon-button"
                type="button"
                disabled={index === setup.cardDatasIds.length - 1}
                aria-label={card.name + 'を下へ'}
                onClick={() => onChange(moveSetupCard(setup, card.cardDatasId, 1))}
              >
                <ArrowDown size={18} aria-hidden="true" />
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label={card.name + 'を外す'}
                onClick={() => onChange(toggleSetupCard(setup, card.cardDatasId))}
              >
                <Minus size={18} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <section>
        <h2>カード一覧</h2>
        <div className="setup-deck-grid">
          {baseCards.map((card) => (
            <div key={card.cardDatasId} className="setup-catalog-card">
              <button
                type="button"
                className={'card-browser-card color-' + card.performer}
                aria-label={card.name}
                data-card-id={card.cardDatasId}
                aria-pressed={setup.cardDatasIds.includes(card.cardDatasId)}
                onClick={() => onChange(toggleSetupCard(setup, card.cardDatasId))}
              >
                <HandCardFace card={card} consumeAp={card.consumeAp} />
                {setup.cardDatasIds.includes(card.cardDatasId) && (
                  <Check className="setup-card-check" size={22} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                className="button quiet"
                aria-label={card.name + 'の性能を見る'}
                onClick={() => onCard(card)}
              >
                性能を見る
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
