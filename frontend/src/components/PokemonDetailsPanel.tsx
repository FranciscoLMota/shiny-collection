
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { getPokemonById } from "../services/pokemon";
import type { DexEntry } from "../types/pokemon";
import PokemonCollection from "./PokemonCollection";
import Button from "./Button";
import { GraphicMark } from "./GraphicMark";
import SystemLoading from "./SystemLoading";
import { delayForDevLoadingPreview } from "../utils/devLoadingPreview";
import FigureLabel from "./FigureLabel";

interface Props {
  pokemonId: number | null;
  onClose: () => void;
  onCollectionChanged: () => void;
}

// Formats API keys into readable labels.
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
    <div className="orbital-frame relative flex aspect-square items-center justify-center border border-outline bg-canvas p-4">
      <GraphicMark variant="target" className="orbital-target" />
      {src ? (
        <img
          src={src}
          alt={alt}
          className="relative size-full object-contain"
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
  const [isClosing, setIsClosing] = useState(false);

  const closePanel = useCallback(() => {
    if (isClosing) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }

    setIsClosing(true);
  }, [isClosing, onClose]);

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
        await delayForDevLoadingPreview(controller.signal);
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
      if (event.key === "Escape") closePanel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pokemonId, closePanel]);

  if (pokemonId === null) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close Pokémon details"
        onClick={closePanel}
        className={`bios-backdrop absolute inset-0 w-full border-0 p-0 ${
          isClosing ? "dex-panel-backdrop-exit" : "dex-panel-backdrop"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Pokémon details"
        className={`dex-details-panel absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto overscroll-contain border-l border-outline bg-elevated p-4 sm:p-6 ${
          isClosing ? "dex-panel-exit" : "dex-panel-enter"
        }`}
        onAnimationEnd={(event) => {
          if (
            event.target !== event.currentTarget ||
            event.animationName !== "dex-panel-exit"
          ) {
            return;
          }

          setIsClosing(false);
          onClose();
        }}
      >
        <header className="mb-4">
          {pokemon && (
            <p className="font-mono text-micro uppercase tracking-widest text-ink">
              #{String(pokemon.species.nationalDexNumber).padStart(4, "0")}
            </p>
          )}
          <div className="mt-1 flex items-center justify-between gap-3">
            <h2 className="min-w-0 font-display text-2xl font-bold uppercase leading-tight tracking-tight wrap-anywhere">
              {pokemon?.displayName ?? "Pokédex entry"}
            </h2>
            <Button variant="icon" type="button" onClick={closePanel} aria-label="Close Pokémon details">
              <X size={16} strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </div>
          {pokemon && (
            <p className="mt-2 font-body text-sm text-muted">
              {pokemon.species.genus ?? "Pokémon"}
              {" · "}
              Generation {pokemon.species.generation}
            </p>
          )}
        </header>

        {loading && <SystemLoading className="py-8" />}
        {error && <p role="alert" className="text-danger">{error}</p>}

        {pokemon && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <PokemonImage
                  src={pokemon.artworkDefault ?? pokemon.spriteDefault}
                  alt={pokemon.displayName}
                />
                <FigureLabel
                  number={1}
                  subject="Regular"
                  className="mt-2 block text-center"
                />
              </div>
              <div>
                <PokemonImage
                  src={pokemon.artworkShiny ?? pokemon.spriteShiny}
                  alt={`Shiny ${pokemon.displayName}`}
                />
                <div className="mt-2 flex items-center justify-center gap-1">
                  <FigureLabel number={2} subject="Shiny" />
                  <Sparkles
                    strokeWidth={1.5}
                    size={12}
                    aria-hidden="true"
                    className="text-ink"
                  />
                </div>
              </div>
            </div>

            <details className="accordion-smooth border-b border-outline">
              <summary className="cursor-pointer py-2.5 font-mono text-micro uppercase tracking-widest text-ink marker:text-accent">
                More info
              </summary>
              <dl className="border-t border-outline py-1">
                {[
                  {
                    label: "Type",
                    value: [pokemon.primaryType, pokemon.secondaryType]
                      .filter((type): type is string => Boolean(type))
                      .map(formatName)
                      .join("/"),
                  },
                  {
                    label: "Region",
                    value: formatName(pokemon.region ?? "standard"),
                  },
                  {
                    label: "Height",
                    value: pokemon.height === null
                      ? "Unknown"
                      : `${(pokemon.height / 10).toFixed(1)} m`,
                  },
                  {
                    label: "Weight",
                    value: pokemon.weight === null
                      ? "Unknown"
                      : `${(pokemon.weight / 10).toFixed(1)} kg`,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-baseline gap-2 py-1.5"
                  >
                    <dt className="technical-label shrink-0">{label}</dt>
                    <span
                      aria-hidden="true"
                      className="min-w-2 flex-1 border-b border-dotted border-outline"
                    />
                    <dd className="text-right font-body text-sm">{value}</dd>
                  </div>
                ))}
                <div className="border-t border-outline py-2">
                  <dt className="technical-label">Pokédex entry</dt>
                  <dd className="mt-1 font-body text-sm leading-6 text-muted">
                    {pokemon.species.description ??
                      "No Pokédex description available."}
                  </dd>
                </div>
              </dl>
            </details>

            <PokemonCollection
              dexEntryId={pokemon.id}
              ownedPokemon={pokemon.ownedPokemon ?? []}
              shinyImage={pokemon.spriteShiny ?? pokemon.artworkShiny}
              onChanged={refreshCollection}
            />
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
}
