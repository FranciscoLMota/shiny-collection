interface DexBarcodeProps {
  nationalDexNumber: number;
}

export default function DexBarcode({
  nationalDexNumber,
}: DexBarcodeProps) {
  const dexNumber = String(nationalDexNumber).padStart(4, "0");
  const encodedDigits = dexNumber
    .split("")
    .flatMap((digit) =>
      Number(digit).toString(2).padStart(4, "0").split("")
    );

  return (
    <div
      role="img"
      aria-label={`Barcode for National Pokédex number ${dexNumber}`}
      className="flex shrink-0 flex-col items-center gap-1"
    >
      <div className="flex h-5 items-stretch" aria-hidden="true">
        <span className="h-5 w-0.5 bg-ink" />
        {encodedDigits.map((bit, index) => (
          <span key={index} className="flex h-5 items-stretch">
            <span className="h-5 w-0.5 bg-ink" />
            <span
              className="h-5"
              style={{ width: bit === "1" ? 3 : 1 }}
            />
          </span>
        ))}
        <span className="h-5 w-0.5 bg-ink" />
      </div>
      <span className="font-mono text-[9px] leading-none tracking-[0.2em] text-muted">
        {dexNumber}
      </span>
    </div>
  );
}
