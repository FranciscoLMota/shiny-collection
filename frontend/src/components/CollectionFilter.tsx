
import type { PokemonFilters } from "../services/pokemon";

type CollectionStatus = NonNullable<
  PokemonFilters["collection"]
>;

interface CollectionFilterProps {
  value: CollectionStatus;
  onChange: (value: CollectionStatus) => void;
}

const options: {
  label: string;
  value: CollectionStatus;
}[] = [
  { label: "All Pokémon", value: "" },
  { label: "Missing", value: "missing" },
  { label: "Obtained", value: "obtained" },
  { label: "In HOME", value: "home" },
  { label: "Not in HOME", value: "not-in-home" },
];

export default function CollectionFilter({
  value,
  onChange,
}: CollectionFilterProps) {
  return (
    <div className="mb-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
        Collection status
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`
                rounded-lg border px-4 py-2.5
                text-sm font-medium
                transition-all duration-200
                ${
                  active
                    ? "border-gold bg-gold text-obsidian"
                    : "border-border bg-surface text-muted hover:border-gold/60 hover:text-white"
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
