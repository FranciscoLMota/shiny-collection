
import type { PokemonFilters as FilterValues } from "../services/pokemon";
import Button from "./Button";

interface PokemonFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

const types = [
  "normal", "fire", "water", "electric", "grass",
  "ice", "fighting", "poison", "ground", "flying",
  "psychic", "bug", "rock", "ghost", "dragon",
  "dark", "steel", "fairy",
];

const inputClass =
  "w-full rounded-lg border border-border bg-surface " +
  "px-3 py-2.5 font-body text-xs font-medium text-white outline-none " +
  "transition-colors focus:border-gold";

// Provides search and attribute filters for the Pokédex list.
export default function PokemonFilters({
  filters,
  onChange,
}: PokemonFiltersProps) {
  function update(changes: Partial<FilterValues>) {
    onChange({ ...filters, ...changes, page: 1 });
  }

  function clear() {
    onChange({
      search: "",
      generation: undefined,
      type: "",
      region: "",
      collection: "",
      page: 1,
      limit: filters.limit,
    });
  }

  return (
    <div className="mb-7 rounded-xl border border-border bg-surface/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input
          type="search"
          aria-label="Search Pokémon"
          placeholder="Name or National Dex #"
          value={filters.search ?? ""}
          onChange={(e) => update({ search: e.target.value })}
          className={inputClass}
        />

        <select
          aria-label="Generation"
          value={filters.generation ?? ""}
          onChange={(e) =>
            update({
              generation: e.target.value
                ? Number(e.target.value)
                : undefined,
            })
          }
          className={inputClass}
        >
          <option value="">All generations</option>
          {Array.from({ length: 9 }, (_, i) => i + 1).map(
            (gen) => (
              <option key={gen} value={gen}>
                Generation {gen}
              </option>
            )
          )}
        </select>

        <select
          aria-label="Pokémon type"
          value={filters.type ?? ""}
          onChange={(e) => update({ type: e.target.value })}
          className={inputClass}
        >
          <option value="">All types</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type[0].toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        <select
          aria-label="Regional form"
          value={filters.region ?? ""}
          onChange={(e) => update({ region: e.target.value })}
          className={inputClass}
        >
          <option value="">All forms</option>
          <option value="standard">Standard</option>
          <option value="alola">Alolan</option>
          <option value="galar">Galarian</option>
          <option value="hisui">Hisuian</option>
          <option value="paldea">Paldean</option>
        </select>

        <Button
          variant="outline"
          type="button"
          onClick={clear}
          className="rounded-lg border border-border px-4 py-2.5 font-body text-xs font-medium text-muted transition-colors hover:border-gold hover:text-white"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
