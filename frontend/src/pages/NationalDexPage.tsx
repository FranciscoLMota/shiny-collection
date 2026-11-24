
import { useEffect, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import PokemonCard from "../components/PokemonCard";
import PokemonFilters from "../components/PokemonFilters";
import PokemonDetailsPanel from "../components/PokemonDetailsPanel";
import { getPokemon } from "../services/pokemon";
import type { PokemonFilters as FilterValues } from "../services/pokemon";
import type { DexEntry } from "../types/pokemon";
import CollectionFilter from "../components/CollectionFilter";
import {
  getCollectionSummary,
  type CollectionSummary,
} from "../services/collection";
import { quickAddPokemon } from "../services/collection";
import { createHunt } from "../services/hunt";
import Button from "../components/Button";
import { ProgressBar } from "../components/ProgressBar";
import { GraphicMark } from "../components/GraphicMark";
import SystemLoading from "../components/SystemLoading";
import ScrambleNumber from "../components/ScrambleNumber";
import { delayForDevLoadingPreview } from "../utils/devLoadingPreview";

const generationColors = [
  "accent",
  "sky",
  "solar",
  "success",
  "danger",
] as const;

export default function NationalDexPage() {
  const [pokemon, setPokemon] = useState<DexEntry[]>([]);
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    page: 1,
    limit: 30,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] =
    useState<CollectionSummary | null>(null);
  const previousRefreshKey = useRef(refreshKey);

  useEffect(() => {
    const controller = new AbortController();
    const isMutationRefresh =
      previousRefreshKey.current !== refreshKey;
    previousRefreshKey.current = refreshKey;

    async function loadPokemon() {
      if (!isMutationRefresh) {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await getPokemon(filters, controller.signal);
        if (!isMutationRefresh) {
          await delayForDevLoadingPreview(controller.signal);
        }

        if (!controller.signal.aborted) {
          setPokemon(result.data);
          setTotal(result.pagination.total);
          setTotalPages(result.pagination.totalPages);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load Pokémon.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPokemon();
    return () => controller.abort();
  }, [filters, refreshKey]);

  useEffect(() => {
    let active = true;

    getCollectionSummary()
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [refreshKey]);
  const page = filters.page ?? 1;


  async function handleQuickAdd(dexEntryId: number) {
    await quickAddPokemon(dexEntryId);

    setPokemon((current) =>
      current.map((entry) =>
        entry.id === dexEntryId
          ? {
              ...entry,
              collection: {
                ownedCount: (entry.collection?.ownedCount ?? 0) + 1,
                isObtained: true,
                isInHome: entry.collection?.isInHome ?? false,
              },
            }
          : entry
      )
    );
    setRefreshKey((current) => current + 1);
  }

  async function handleQuickHunt(dexEntryId: number) {
    await createHunt({
      dexEntryId,
      status: "ACTIVE",
    });
  }


  return (
    <main className="page-enter flex-1 bg-canvas px-4 py-6 text-ink sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="bios-heading mb-6">
          <GraphicMark variant="orbital" className="bios-heading-mark" />
          <span className="section-index" aria-hidden="true">01</span>
          <p className="mb-2 font-mono text-micro uppercase tracking-widest text-ink">
            SPON / Specimen Collection
          </p>
          <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl">
            National Pokédex
          </h1>
          <p className="mt-3 font-body text-sm text-muted">
            Explore your living shiny collection.
          </p>
        </header>

        {summary && (
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Required entries", summary.required],
              ["Obtained", summary.obtained],
              ["In Pokémon HOME", summary.inHome],
              ["Total shinies", summary.specimens],
            ].map(([label, value], index) => (
              <div
                key={label}
                className="data-block-enter panel border-t-2 border-t-ink p-3"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="font-mono text-micro uppercase tracking-widest text-muted">{label}</p>
                <p className="mt-2 font-body text-3xl tabular-nums">
                  <ScrambleNumber value={Number(value)} delayMs={index * 80} />
                </p>
              </div>
            ))}
          </div>
        )}

        {summary?.generations?.length ? (
          <details open className="accordion-smooth mb-4 border-b border-outline">
            <summary className="cursor-pointer py-2.5 font-mono text-micro uppercase tracking-widest text-ink marker:text-accent">
              Generation progress
            </summary>
            <div className="grid gap-x-6 gap-y-3 border-t border-outline p-3 sm:grid-cols-2 xl:grid-cols-3">
              {summary.generations.map((generation, index) => (
                <ProgressBar
                  key={generation.generation}
                  label={`Gen ${generation.generation}`}
                  value={generation.obtained}
                  max={generation.total}
                  percentage={generation.obtainedPercent}
                  color={generationColors[index % generationColors.length]}
                  entranceDelay={index * 80}
                />
              ))}
            </div>
          </details>
        ) : null}

        <details className="accordion-smooth dex-filters group mb-4 border border-outline bg-surface">
          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 font-mono text-micro uppercase tracking-widest text-ink hover:bg-elevated focus-visible:-outline-offset-2 motion-safe:transition-colors pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal size={14} strokeWidth={1.5} aria-hidden="true" />
            <span className="flex-1">Filters</span>
            <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" className="group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200" />
          </summary>
          <div className="space-y-2 border-t border-outline p-2">
            <PokemonFilters
              filters={filters}
              onChange={setFilters}
            />

            <CollectionFilter
              value={filters.collection ?? ""}
              onChange={(collection) => {
                setFilters((current) => ({
                  ...current,
                  collection,
                  page: 1,
                }));
              }}
            />
          </div>
        </details>

        <div className="mb-3 flex items-center justify-between border-b border-outline pb-2">
          <p className="font-body text-sm text-muted">
            {total} Pokémon entries
          </p>
          <span className="font-mono text-micro uppercase tracking-widest text-ink">
            National Dex
          </span>
        </div>

        {loading && <SystemLoading className="py-12" />}

        {error && (
          <p role="alert" className="py-12 text-center text-danger">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div
              key={JSON.stringify(filters)}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {pokemon.map((entry, index) => (
                <PokemonCard
                  key={entry.id}
                  pokemon={entry}
                  onClick={setSelectedId}
                  entranceDelay={index * 24}
                  onQuickAdd={handleQuickAdd}
                  onQuickHunt={handleQuickHunt}
                />
              ))}
            </div>

            {pokemon.length === 0 && (
              <p className="py-12 text-center text-muted">
                No Pokémon match your filters.
              </p>
            )}

            <div className="mt-10 flex items-center justify-center gap-6">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: page - 1,
                  }))
                }
                className="shape-angular border border-outline bg-surface px-4 py-2 font-body text-xs font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </Button>

              <span className="font-body text-sm text-muted">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: page + 1,
                  }))
                }
                className="shape-angular border border-outline bg-surface px-4 py-2 font-body text-xs font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>

      <PokemonDetailsPanel
        pokemonId={selectedId}
        onClose={() => setSelectedId(null)}
        onCollectionChanged={() => {
          setRefreshKey((value) => value + 1);
        }}
      />
    </main>
  );
}
