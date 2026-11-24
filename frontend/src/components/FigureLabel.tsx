interface FigureLabelProps {
  number: number;
  subject: string;
  prefix?: string;
  className?: string;
}

export default function FigureLabel({
  number,
  subject,
  prefix = "FIG.",
  className = "",
}: FigureLabelProps) {
  return (
    <span
      className={`font-mono text-micro uppercase tracking-widest text-muted ${className}`}
    >
      {prefix}{String(number).padStart(2, "0")}/{subject}
    </span>
  );
}
