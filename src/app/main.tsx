import { render } from 'preact';
import { readLibrary } from '../infrastructure/storage/library';
import '../styles/theme.css';
import '../styles/portraits.css';
import '../styles/lobby.css';
import '../styles/game.css';
import '../styles/stage.css';
import '../styles/dialogs.css';
import { App } from './App';

const root = document.querySelector('#app');
if (!root) throw new Error('アプリの表示先がありません。');
try {
  render(<App initialLibrary={readLibrary(localStorage)} />, root);
} catch (error) {
  render(
    <main className="startup-error">
      <h1>ラブギャザー</h1>
      <p role="alert">{error instanceof Error ? error.message : '起動できません。'}</p>
      <button type="button" className="button primary" onClick={() => location.reload()}>
        再読み込み
      </button>
    </main>,
    root,
  );
}
