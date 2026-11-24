interface SystemLoadingProps {
  className?: string;
}

export default function SystemLoading({
  className = "",
}: SystemLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`system-loading ${className}`}
    >
      <p className="system-loading-label font-mono text-xs uppercase tracking-[0.16em] text-ink">
        Retrieving data
        <span className="system-loading-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>

      <div className="system-loading-meter" aria-hidden="true">
        <span className="system-loading-bracket">[</span>
        <div className="system-loading-segments">
          {Array.from({ length: 6 }, (_, index) => (
            <span
              key={index}
              className="system-loading-segment"
              style={{ animationDelay: `${index * 130}ms` }}
            />
          ))}
        </div>
        <span className="system-loading-bracket">]</span>
      </div>
      <span className="system-loading-meta" aria-hidden="true">
        SYS / FETCH CHANNEL 01
      </span>
    </div>
  );
}
