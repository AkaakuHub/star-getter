# カードパック

公開パックは`src/content/packs/index.ts`へ公開日順に登録します。登録したパックは編成画面で選択できます。

## 追加手順

1. `src/content/packs/`にパックのTypeScriptファイルを追加します。
2. `CardPack`型でID、名前、公開日、カード配列を定義します。
3. `src/content/packs/index.ts`の`packs`末尾へ追加します。
4. `vp check`、`vp test`、`vp run knip`、`vp build`を実行します。

カードIDは全パックで一意にし、公開後は変更しません。公開したパックとカードを削除せず、新しいパックを末尾へ追加します。編成と育成の保存では、このカードIDを使用します。

カードのコスト、アピール、効果量、得点倍率、効果時間、パックの公開日、ID重複は共通catalog処理で検査します。数値の上限は`src/domain/game/deck.ts`で定義します。
