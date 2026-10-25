import { projectStarScore } from './starScore';

export function StarScore({ value }: Readonly<{ value: bigint }>) {
  const display = projectStarScore(value);
  return (
    <div
      className="score-value love-number"
      aria-label={value.toString() + 'スター'}
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
