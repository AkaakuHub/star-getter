import { projectLoveScore } from './loveScore';

export function LoveScore({ value }: Readonly<{ value: bigint }>) {
  const display = projectLoveScore(value);
  return (
    <div
      className="score-value love-number"
      aria-label={value.toString() + 'LOVE'}
      style={{ '--love-columns': display.columns, '--love-rows': display.rows }}
    >
      {display.digits.map(({ digit, place, comma, unit }) => (
        <span key={place} className="love-digit" aria-hidden="true">
          {digit}
          {comma && <span className="love-comma">,</span>}
          {unit && <small className="love-unit">{unit}</small>}
        </span>
      ))}
    </div>
  );
}
