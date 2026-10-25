import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { ChevronLeft } from 'lucide-preact';
import type { Card, GameState } from '../../domain/game/model';
import { cardCost } from '../../domain/game/cards/cost';
import { Modal } from '../components/Modal';
import { HandCardFace } from './HandCardFace';
import { CardPerformance } from './CardPerformance';
import { cardGroups } from './cardGroups';

export function CardBrowser({
  state,
  initialBoard,
  onClose,
}: Readonly<{ state: GameState; initialBoard: 'hand' | 'deck'; onClose: () => void }>) {
  const [selected, setSelected] = useState<Card | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const initial = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const viewport = list.current;
    const target = initial.current;
    if (!viewport || !target) return;
    const observer = new ResizeObserver(() => {
      if (viewport.clientHeight === 0) return;
      viewport.scrollTop +=
        target.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
      observer.disconnect();
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <Modal title="カード確認" onClose={onClose} className="card-browser">
        <div ref={list} className="card-browser-list">
          {cardGroups(state).map(({ board, title, cards }) => (
            <section key={board} ref={board === initialBoard ? initial : undefined}>
              <h3>
                {title} {cards.length}
              </h3>
              <div className="card-browser-cards">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={'card-browser-card color-' + card.performer}
                    onClick={() => setSelected(card)}
                    aria-label={card.name + 'の性能を確認'}
                  >
                    <HandCardFace card={card} cost={cardCost(state, card)} />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Modal>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} className="card-detail">
          <button
            type="button"
            className="button card-browser-back"
            onClick={() => setSelected(null)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
            一覧に戻る
          </button>
          <CardPerformance card={selected} cost={cardCost(state, selected)} />
        </Modal>
      )}
    </>
  );
}
