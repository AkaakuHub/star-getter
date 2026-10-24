import { useState } from 'preact/hooks';
import { cards } from '../../content/cards';
import { performers } from '../../content/performers';
import { CardView } from './CardView';
import { Modal } from './Modal';

export function DeckEditor({
  initial,
  onSave,
  onClose,
}: Readonly<{
  initial: readonly string[];
  onSave: (ids: readonly string[]) => void;
  onClose: () => void;
}>) {
  const [selected, setSelected] = useState(initial);
  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };
  return (
    <Modal title={`編成 ${selected.length}/9`} onClose={onClose} className="deck-modal">
      <div className="deck-groups">
        {Object.values(performers).map((performer) => (
          <section key={performer.id} className={`color-${performer.id}`}>
            <h3>{performer.name}</h3>
            <div className="catalog-cards">
              {cards
                .filter((card) => card.performer === performer.id)
                .map((card) => (
                  <CardView
                    key={card.id}
                    card={card}
                    selected={selected.includes(card.id)}
                    disabled={!selected.includes(card.id) && selected.length >= 9}
                    onClick={() => toggle(card.id)}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
      <div className="modal-actions">
        <button type="button" className="button quiet" onClick={onClose}>
          キャンセル
        </button>
        <button
          type="button"
          className="button primary"
          disabled={selected.length !== 9}
          onClick={() => onSave(selected)}
        >
          編成を保存
        </button>
      </div>
    </Modal>
  );
}
