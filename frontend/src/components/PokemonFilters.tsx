
import type { PokemonFilters as FilterValues } from "../services/pokemon";
import Button from "./Button";
import { RotateCcw, Search } from "lucide-react";

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
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-[minmax(12rem,2fr)_repeat(3,minmax(0,1fr))_auto]">
      <div className="relative col-span-2 sm:col-span-4 lg:col-span-1">
        <Search size={15} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          aria-label="Search Pokémon"
          placeholder="Name or National Dex #"
          value={filters.search ?? ""}
          onChange={(e) => update({ search: e.target.value })}
          className="field filter-field pl-8"
        />
      </div>

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
        className="field filter-field filter-select"
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
        className="field filter-field filter-select"
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
        className="field filter-field filter-select"
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
        className="filter-option"
      >
        <RotateCcw size={13} strokeWidth={1.5} aria-hidden="true" />
        Clear
      </Button>
    </div>
  );
}
