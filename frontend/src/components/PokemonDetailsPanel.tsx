
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getPokemonById } from "../services/pokemon";
import type { DexEntry } from "../types/pokemon";
import PokemonCollection from "./PokemonCollection";
import Button from "./Button";

interface Props {
  pokemonId: number | null;
  onClose: () => void;
  onCollectionChanged: () => void;
}

// Formats API ability keys into readable names.
function formatName(value: string) {
  return value
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

// Shows the best available Pokémon image or a fallback message.
function PokemonImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  return (
    <div className="flex aspect-square items-center justify-center rounded-xl border border-border bg-obsidian p-4">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="font-body text-sm text-muted">
          Image unavailable
        </span>
      )}
    </div>
  );
}

// Loads Pokémon details and hosts the specimen-management panel.
export default function PokemonDetailsPanel({
  pokemonId,
  onClose,
  onCollectionChanged,
}: Props) {
  const [pokemon, setPokemon] = useState<DexEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function refreshCollection() {
    setRefreshKey((value) => value + 1);
    onCollectionChanged();
  }

  useEffect(() => {
    if (pokemonId === null) return;

    const controller = new AbortController();
    const selectedPokemonId = pokemonId;

    async function load() {
      setLoading(true);
      setPokemon(null);
      setError(null);

      try {
        const result = await getPokemonById(
          selectedPokemonId,
          controller.signal
        );
        if (!controller.signal.aborted) {
          setPokemon(result.data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load Pokémon details.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [pokemonId, refreshKey]);

  useEffect(() => {
    if (pokemonId === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pokemonId, onClose]);

  if (pokemonId === null) return null;

  const stats = pokemon
    ? [
        ["HP", pokemon.hp],
        ["Attack", pokemon.attack],
        ["Defense", pokemon.defense],
        ["Sp. Attack", pokemon.specialAttack],
        ["Sp. Defense", pokemon.specialDefense],
        ["Speed", pokemon.speed],
      ] as const
    : [];

  return (
    <div className="fixed inset-0 z-50">
      <Button
        variant="ghost"
        type="button"
        aria-label="Close Pokémon details"
        onClick={onClose}
        className="absolute inset-0 min-h-0 w-full border-0 bg-black/75 p-0 hover:bg-black/75"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Pokémon details"
        className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-border bg-surface p-5 shadow-2xl sm:p-8"
      >
        <div className="mb-7 flex items-center justify-between">
          <span className="font-mono text-micro uppercase tracking-widest text-gold">
            Pokédex entry
          </span>

          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-2 font-body text-xs font-medium text-muted hover:text-white"
          >
            Close ✕
          </Button>
        </div>

        {loading && <p className="text-muted">Loading details...</p>}
        {error && <p role="alert" className="text-red-400">{error}</p>}

        {pokemon && (
          <div className="space-y-7">
            <header>
              <p className="font-mono text-micro uppercase tracking-widest text-gold">
                #{String(pokemon.species.nationalDexNumber).padStart(4, "0")}
              </p>
              <h2 className="mt-1 font-display text-4xl font-medium tracking-tighter">
                {pokemon.displayName}
              </h2>
              <p className="mt-2 font-body text-sm text-muted">
                {pokemon.species.genus ?? "Pokémon"}
                {" · "}
                Generation {pokemon.species.generation}
              </p>
            </header>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <PokemonImage
                  src={pokemon.artworkDefault ?? pokemon.spriteDefault}
                  alt={pokemon.displayName}
                />
                <p className="mt-2 text-center font-body text-xs text-muted">
                  Regular
                </p>
              </div>
              <div>
                <PokemonImage
                  src={pokemon.artworkShiny ?? pokemon.spriteShiny}
                  alt={`Shiny ${pokemon.displayName}`}
                />
                <p className="mt-2 flex items-center justify-center gap-1 text-center font-body text-xs text-gold">
                  Shiny <Sparkles size={12} aria-hidden="true" />
                </p>
              </div>
            </div>

            <section>
              <h3 className="mb-3 font-display text-xl font-semibold">
                Pokédex information
              </h3>
              <p className="font-body text-sm leading-7 text-muted">
                {pokemon.species.description ??
                  "No Pokédex description available."}
              </p>
            </section>

            <div className="grid grid-cols-2 gap-3 font-body text-sm">
              <div className="rounded-lg border border-border p-4">
                <p className="mb-1 font-mono text-micro uppercase tracking-widest text-muted">Type</p>
                <p className="capitalize">
                  {[pokemon.primaryType, pokemon.secondaryType]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="mb-1 font-mono text-micro uppercase tracking-widest text-muted">Region</p>
                <p className="capitalize">
                  {pokemon.region ?? "Standard"}
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="mb-1 font-mono text-micro uppercase tracking-widest text-muted">Height</p>
                <p>
                  {pokemon.height === null
                    ? "Unknown"
                    : `${(pokemon.height / 10).toFixed(1)} m`}
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="mb-1 font-mono text-micro uppercase tracking-widest text-muted">Weight</p>
                <p>
                  {pokemon.weight === null
                    ? "Unknown"
                    : `${(pokemon.weight / 10).toFixed(1)} kg`}
                </p>
              </div>
            </div>

            <section>
              <h3 className="mb-3 font-display text-xl font-semibold">
                Abilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {pokemon.abilities.map((ability) => (
                  <span
                    key={ability}
                    className="rounded-md bg-obsidian px-3 py-2 font-body text-sm"
                  >
                    {formatName(ability)}
                  </span>
                ))}
                {pokemon.hiddenAbility && (
                  <span className="rounded-md border border-gold/40 px-3 py-2 font-body text-sm text-gold">
                    {formatName(pokemon.hiddenAbility)} · Hidden
                  </span>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-4 font-display text-xl font-semibold">
                Base stats
              </h3>
              <div className="space-y-3">
                {stats.map(([name, value]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between font-body text-xs">
                      <span className="text-muted">{name}</span>
                      <span>{value ?? "—"}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-obsidian">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{
                          width: `${Math.min(
                            100,
                            ((value ?? 0) / 255) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <PokemonCollection
              dexEntryId={pokemon.id}
              ownedPokemon={pokemon.ownedPokemon ?? []}
              onChanged={refreshCollection}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
