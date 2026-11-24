import type { SVGProps } from "react";

type GraphicVariant =
  | "solar"
  | "signal"
  | "target"
  | "frame"
  | "orbital"
  | "identifier";

interface GraphicMarkProps
  extends SVGProps<SVGSVGElement> {
  variant: GraphicVariant;
  size?: number;
}

export function GraphicMark({
  variant,
  size = 24,
  ...props
}: GraphicMarkProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden="true"
      {...props}
    >
      {variant === "solar" && (
        <g
          transform="translate(40 40)"
          fill="currentColor"
          stroke="none"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x={-5}
              y={-34}
              width={10}
              height={25}
              transform={`rotate(${i * 45})`}
            />
          ))}
        </g>
      )}

      {variant === "signal" && (
        <g fill="currentColor" stroke="none">
          {Array.from({ length: 4 }, (_, i) => (
            <path
              key={i}
              d={`M${17 + i * 16} 20
                  h9 l-15 40 h-9 Z`}
            />
          ))}
        </g>
      )}

      {variant === "target" && (
        <g>
          <circle cx={40} cy={40} r={28} />
          <circle cx={40} cy={40} r={19} />
          <circle cx={40} cy={40} r={4} />
          <path d="M6 40H74M40 6V74" />
        </g>
      )}

      {variant === "frame" && (
        <g>
          <path
            d="M5 25V5H25
               M55 5H75V25
               M75 55V75H55
               M25 75H5V55"
            strokeWidth={2}
          />
          <path d="M34 40H46M40 34V46" />
        </g>
      )}

      {variant === "orbital" && (
        <g transform="translate(40 40)">
          <ellipse
            rx={35}
            ry={12}
            transform="rotate(-35)"
          />
          <ellipse
            rx={35}
            ry={12}
            transform="rotate(35)"
          />
          <circle r={21} />
          <circle r={5} className="fill-accent" />
        </g>
      )}

      {variant === "identifier" && (
        <g fill="currentColor" stroke="none">
          {[3, 1, 5, 2, 4, 1, 3, 5, 2, 3, 1, 4]
            .map((width, i) => (
              <rect
                key={i}
                x={5 + i * 6}
                y={18}
                width={width}
                height={44}
              />
            ))}
        </g>
      )}
    </svg>
  );
}
