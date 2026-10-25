# スターギャザー

固定プリセット「書架」「開花」のカードを組み合わせ、きらめきを回収してスターを集めるブラウザゲームです。読み込み直後に1曲の演奏が始まります。

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
