import { render } from 'preact';
import { cards } from '../content/cards';
import { moodNames, performers } from '../content/performers';

const root = document.querySelector('#app');
if (!root) throw new Error('アプリの表示先がありません。');
render(
  <main>
    <h1>ラブギャザー</h1>
    <ul>
      {cards.map((card) => (
        <li key={card.id}>
          {card.name} / {performers[card.performer].name} /{' '}
          {moodNames[performers[card.performer].mood]}
        </li>
      ))}
    </ul>
  </main>,
  root,
);
