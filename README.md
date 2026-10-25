# スターギャザー

固定プリセット「うなばら」「開花」のカードを組み合わせ、スターを回収するブラウザゲームです。読み込み直後に60秒のゲームが始まります。

キャラクターは「たいよう・くも・あめ」の3人です。衣装ごとの小物・配色・背景模様を持つカードで表現します。

## 開発

Node.js 24 LTSと[Vite+](https://viteplus.dev/)を使用します。

```sh
vp install
vp dev
```

```sh
vp check
vp test
vp run knip
vp build
```

TypeScript、Preact、Canvasで構成し、Oxlint・Oxfmtを`vp check`から実行します。lefthookはcommit時に検証を、push時にbuildを実行します。

## 内部計算のE2Eと操作記録

```sh
pnpm e2e
```

実ゲームと共通の初期化・カード効果・ゲーム時計を使い、DOMを使わずに60秒を進めます。両編成の準備と回収連鎖、手動回収と自動回収、連打速度の差、カードを使わない場合との比較を検証します。

操作記録は`artifacts/e2e/`へJSONとMarkdownで保存します。失敗したテストの記録も残ります。同じケースの再実行では記録を更新します。

- JSONには各入力の時刻・tick・カード名・カードID・手札位置と、操作前後の得点・専用値・デッキ枚数・エナジーを保存します。
- Markdownにはゲーム内のカード名で操作順を表示し、連続回収をまとめます。ファイル名の`library`はうなばら、`bloom`は開花を表します。

カード効果は`src/content/cards/`、計算処理は`src/domain/game/`、編成ごとの得点倍率とゲーム時間は`src/content/balance.ts`で管理します。画面とE2Eは共通の`src/app/createPresetGame.ts`を使います。
