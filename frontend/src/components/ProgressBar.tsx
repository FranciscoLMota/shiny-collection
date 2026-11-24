import ScrambleNumber from "./ScrambleNumber";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  percentage?: number;
  color?: "accent" | "sky" | "solar" | "success" | "danger";
  entranceDelay?: number;
}

export function ProgressBar({
  value,
  max,
  label = "Collection",
  percentage: suppliedPercentage,
  color,
  entranceDelay = 0,
}: ProgressBarProps) {
  const safeMax = Number.isFinite(max)
    ? Math.max(0, max)
    : 0;

  const safeValue = Number.isFinite(value)
    ? Math.min(safeMax, Math.max(0, value))
    : 0;

  const percentage = suppliedPercentage !== undefined && Number.isFinite(suppliedPercentage)
    ? Math.min(100, Math.max(0, suppliedPercentage))
    : safeMax > 0 ? (safeValue / safeMax) * 100 : 0;

  return (
    <div
      className="data-block-enter grid min-w-0 gap-1"
      style={{ animationDelay: `${entranceDelay}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <span className="technical-label">{label}</span>
        <span className="font-mono text-micro tabular-nums">
          <ScrambleNumber
            value={safeValue}
            minDigits={3}
            delayMs={entranceDelay}
          />
          {" / "}
          <ScrambleNumber
            value={safeMax}
            minDigits={3}
            delayMs={entranceDelay}
          />
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-valuetext={`${safeValue} of ${safeMax}, ${percentage}%`}
        className="meter-track"
      >
        <div
          className="meter-fill meter-fill-enter"
          style={{
            width: `${percentage}%`,
            backgroundColor: color ? `var(--bios-${color})` : undefined,
            animationDelay: `${entranceDelay}ms`,
          }}
        />
      </div>
    </div>
  );
}
