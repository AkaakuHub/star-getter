import { Modal } from './Modal';

export function HowToPlay({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <Modal title="遊び方" onClose={onClose}>
      <ol className="instructions">
        <li>
          <strong>9枚のカードを編成します。</strong>
          3人のカードを組み合わせて、楽曲を選んでください。
        </li>
        <li>
          <strong>手札の5枚からカードを使います。</strong>
          数字の分だけエネルギーを消費し、山札から1枚補充します。エネルギーは1.5秒で1回復します。
        </li>
        <li>
          <strong>ハートを回収して得点を集めます。</strong>
          音楽とカードからハートが生まれます。画面のハートか回収ボタンを押してください。10秒経過したハートと40個を超えた分は得点が20%になります。
        </li>
        <li>
          <strong>熱気と得点倍率を組み合わせます。</strong>
          熱気は20ごとに倍率が上がり、クライマックスではさらに1.5倍になります。区間のムードと同じ色のカードを多く編成すると、音楽から生まれるハートが増えます。
        </li>
        <li>
          <strong>チャージが100になったら全員スキルを使います。</strong>
          ハート8個、エネルギー3、スタミナ10を得て、8秒間は得点が1.8倍になります。
        </li>
        <li>
          <strong>スタミナが0になると休憩します。</strong>
          スタミナが40まで回復する間はカードの使用とエネルギーの回復、音楽からのハート発生が止まります。
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
