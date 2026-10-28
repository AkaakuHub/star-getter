import { useState } from 'preact/hooks';
import { ArrowRight, Layers, RotateCcw } from 'lucide-preact';
import { routes, routeIds } from '../../content/routes';
import { resolveDeck } from '../../content/cards';
import { createPresetSetup, setupProblem, type GameSetup } from '../../app/setup/gameSetup';
import type { Card } from '@akaakuhub/suku-sute-core/game/model';
import { HandCardFace } from '../cards/HandCardFace';
import { CardPerformance } from '../cards/CardPerformance';
import { Modal } from '../components/Modal';
import { DeckEditor } from './DeckEditor';

export function StartScreen({
  setup,
  onChange,
  onStart,
}: Readonly<{
  setup: GameSetup;
  onChange: (setup: GameSetup) => void;
  onStart: () => void;
}>) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Card | null>(null);
  const problem = setupProblem(setup);
  return (
    <div className="app-shell">
      {editing ? (
        <DeckEditor
          setup={setup}
          onChange={onChange}
          onBack={() => setEditing(false)}
          onCard={setSelected}
        />
      ) : (
        <main className="setup-page">
          <header className="setup-heading">
            <h1>star-getter</h1>
          </header>
          <fieldset className="setup-presets">
            <legend>プリセット</legend>
            <div className="preset-options">
              {routeIds.map((id) => (
                <button
                  key={id}
                  className="button quiet"
                  type="button"
                  aria-pressed={setup.presetId === id}
                  onClick={() => onChange(createPresetSetup(id))}
                >
                  {routes[id].name}
                </button>
              ))}
            </div>
          </fieldset>
          <section aria-label="編成">
            <div className="setup-heading">
              <h2>編成{setup.cardIds.length}枚</h2>
              <button className="button quiet" type="button" onClick={() => setEditing(true)}>
                <Layers size={18} aria-hidden="true" />
                編成する
              </button>
            </div>
            <div className="setup-deck-grid">
              {resolveDeck(setup.cardIds).map((card) => (
                <button
                  key={card.id}
                  className={'card-browser-card color-' + card.performer}
                  type="button"
                  aria-label={card.name + 'の性能を確認'}
                  onClick={() => setSelected(card)}
                >
                  <HandCardFace card={card} consumeAp={card.consumeAp} />
                </button>
              ))}
            </div>
          </section>
          {problem && (
            <p className="error-banner" role="alert">
              {problem}
            </p>
          )}
          <div className="setup-actions">
            <button
              className="button quiet"
              type="button"
              onClick={() => onChange(createPresetSetup(setup.presetId))}
            >
              <RotateCcw size={18} aria-hidden="true" />
              プリセットに戻す
            </button>
            <button
              className="button primary"
              type="button"
              disabled={problem !== null}
              onClick={onStart}
            >
              はじめる
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </main>
      )}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} className="card-detail">
          <CardPerformance card={selected} consumeAp={selected.consumeAp} />
        </Modal>
      )}
    </div>
  );
}
