import { useEffect, useState } from "react";

interface ScrambleNumberProps {
  value: number;
  minDigits?: number;
  delayMs?: number;
  className?: string;
}

function scramble(target: string, revealedDigits = 0) {
  return Array.from(target, (character, index) => {
    if (!/\d/.test(character) || index < revealedDigits) {
      return character;
    }

    return String(Math.floor(Math.random() * 10));
  }).join("");
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function ScrambleNumber({
  value,
  minDigits = 0,
  delayMs = 0,
  className = "",
}: ScrambleNumberProps) {
  const safeValue = Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
  const target = String(safeValue).padStart(minDigits, "0");
  const [displayValue, setDisplayValue] = useState(() =>
    prefersReducedMotion() ? target : scramble(target)
  );

  useEffect(() => {
    if (prefersReducedMotion()) {
      const timeout = window.setTimeout(
        () => setDisplayValue(target),
        delayMs
      );
      return () => window.clearTimeout(timeout);
    }

    let frame = 0;
    let startTime = 0;
    let lastUpdate = 0;

    const tick = (time: number) => {
      if (startTime === 0) startTime = time;
      const progress = Math.min((time - startTime) / 900, 1);

      if (time - lastUpdate >= 50 || progress === 1) {
        const revealedDigits = Math.floor(progress * target.length);
        setDisplayValue(
          progress === 1 ? target : scramble(target, revealedDigits)
        );
        lastUpdate = time;
      }

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    const timeout = window.setTimeout(() => {
      frame = window.requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [delayMs, target]);

  return (
    <span className={className}>
      <span aria-hidden="true">{displayValue}</span>
      <span className="sr-only">{target}</span>
    </span>
  );
}
