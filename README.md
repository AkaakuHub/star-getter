# ラブゲッター

カードを使い、スターを回収するブラウザゲームです。

```sh
git submodule update --init --recursive
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm check
pnpm test run
pnpm e2e
pnpm build
```

計算コアは`vendor/suku-sute-core`を使います。

動画生成にはFFmpegとChromiumが必要です。

```sh
pnpm exec playwright-core install chromium --only-shell
pnpm e2e:video path/to/recording.json
```
