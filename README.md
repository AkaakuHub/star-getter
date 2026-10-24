# ラブギャザー

カードを組み合わせ、音楽に合わせてハートを集めるブラウザゲームです。

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

TypeScript、Preact、Three.jsで構成し、Oxlint・Oxfmtを`vp check`から実行します。lefthookはcommit時に検証を、push時にbuildを実行します。
