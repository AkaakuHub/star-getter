export function Meter({
  name,
  value,
  max = 100,
  className = '',
}: Readonly<{
  name: string;
  value: number;
  max?: number;
  className?: string;
}>) {
  return (
    <div className={`meter ${className}`}>
      <div className="meter-heading">
        <span>{name}</span>
        <strong>
          {Math.floor(value)}
          <span> / {max}</span>
        </strong>
      </div>
      <div
        className="meter-track"
        role="progressbar"
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.floor(value)}
      >
        <span style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}
