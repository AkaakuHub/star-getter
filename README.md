# ラブギャザー

固定プリセット「書架」「開花」のカードを組み合わせ、ハートを集めて9999無量大数を目指すブラウザゲームです。読み込み直後に1曲のライブが始まります。

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
