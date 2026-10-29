import { render } from 'preact';
import '../styles/theme.css';
import { App } from './App';

const root = document.querySelector('#app');
if (!root) throw new Error('アプリの表示先がありません。');
try {
  render(<App />, root);
} catch (error) {
  render(
    <main className="startup-error">
      <h1>ラブゲッター</h1>
      <p role="alert">{error instanceof Error ? error.message : '起動できません。'}</p>
      <button type="button" className="button primary" onClick={() => location.reload()}>
        再読み込み
      </button>
    </main>,
    root,
  );
}
