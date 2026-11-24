
import type { PokemonFilters } from "../services/pokemon";
import Button from "./Button";

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

// Filters the Pokédex by collection ownership and HOME status.
export default function CollectionFilter({
  value,
  onChange,
}: CollectionFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-outline pt-2">
      <p className="technical-label">
        Collection status
      </p>

      <div role="group" aria-label="Collection status" className="flex flex-wrap gap-1">
        {options.map((option) => {
          const active = value === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className="filter-option"
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
