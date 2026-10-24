import { Modal } from './Modal';

export function HowToPlay({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <Modal title="遊び方" onClose={onClose}>
      <ol className="instructions">
        <li>
          <strong>30秒でLOVEを集めます。</strong>
          3人のカードを9枚編成します。カードを2回押すと発動します。強化・育成はありません。
        </li>
        <li>
          <strong>カードと回収を交互に連打します。</strong>
          APは0.5秒で1回復します。回収するハートの数とボルテージによってハートランクが決まり、獲得LOVEが増加します。
        </li>
        <li>
          <strong>「はじまりの星」で開花します。</strong>
          AP・メンタル・ボルテージの増減を専用ゲージへ変換します。開花中はAP残量に関係なくカードを使用できます。開花プログレスの1.5乗に応じて獲得LOVEが増加します。
        </li>
        <li>
          <strong>効果増幅を重ねます。</strong>
          「花咲くノート」「光のプリズム」の効果増幅を加算してスキルへ適用します。「水色のステージ」のAP回復と条件付き増幅を組み合わせ、開花プログレスを増やします。
        </li>
        <li>
          <strong>回収特性を再ドローで復活させます。</strong>
          手札にあるカードの条件を満たすと、回収後にハートが発生します。もう一度回収して連続回収をつなげます。ハートの寿命は楽曲時間に連動します。30秒ライブでは2.5秒です。寿命が尽きた分と100個を超えた追加分は、通常の20%の得点になります。
        </li>
        <li>
          <strong>SPを組み合わせてLOVEを伸ばします。</strong>
          SPが100%になると全員スキルを使用できます。LOVE増加と開花の補正、回収特性を組み合わせてください。一時停止中は手札と効果を確認できます。
        </li>
      </ol>
      <table className="key-table">
        <caption>キーボード操作</caption>
        <tbody>
          <tr>
            <th scope="row">1〜5</th>
            <td>左から順にカードを使用</td>
          </tr>
          <tr>
            <th scope="row">Space</th>
            <td>ハートを回収</td>
          </tr>
          <tr>
            <th scope="row">S</th>
            <td>全員スキル</td>
          </tr>
          <tr>
            <th scope="row">Esc</th>
            <td>一時停止・再開</td>
          </tr>
        </tbody>
      </table>
    </Modal>
  );
}
