
import { useEffect, useRef, useState } from "react";
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

const generationColors = [
  "text-sky-400",
  "text-emerald-400",
  "text-amber-400",
  "text-violet-400",
  "text-rose-400",
  "text-cyan-400",
  "text-orange-400",
  "text-fuchsia-400",
  "text-lime-400",
];

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


  return (
    <main className="min-h-screen bg-obsidian px-4 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-gold uppercase">
            Shiny Archive / Collection
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            National Pokédex
          </h1>
          <p className="mt-3 text-muted">
            Explore your living shiny collection.
          </p>
        </header>

        {summary?.generations?.length ? (
          <details open className="mb-8 rounded-xl border border-border bg-surface">
            <summary className="cursor-pointer px-5 py-4 font-display text-lg font-semibold marker:text-gold">
              Generation progress
              <span className="ml-2 font-sans text-sm font-normal text-muted">
                Distinct Pokémon species collected
              </span>
            </summary>
            <div className="grid grid-cols-2 gap-4 border-t border-border p-5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
              {summary.generations.map((generation) => {
                const color =
                  generationColors[
                    (generation.generation - 1) % generationColors.length
                  ];

                return (
                  <div
                    key={generation.generation}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      role="img"
                      aria-label={`Generation ${generation.generation}: ${generation.obtained} of ${generation.total} species, ${generation.obtainedPercent}%`}
                      className="relative h-20 w-20"
                    >
                      <svg
                        viewBox="0 0 100 100"
                        className="-rotate-90"
                        aria-hidden="true"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-border"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          pathLength="100"
                          strokeDasharray="100 100"
                          strokeDashoffset={100 - generation.obtainedPercent}
                          className={`${color} transition-[stroke-dashoffset]`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                        {generation.obtainedPercent}%
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      Generation {generation.generation}
                    </p>
                    <p className="text-xs text-muted">
                      {generation.obtained} / {generation.total} species
                    </p>
                  </div>
                );
              })}
            </div>
          </details>
        ) : null}

        {summary && (
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Required entries", summary.required],
              ["Obtained", summary.obtained],
              ["In Pokémon HOME", summary.inHome],
              ["Total shinies", summary.specimens],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-2 font-display text-3xl font-bold">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

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

        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-muted">
            {total} Pokémon entries
          </p>
          <span className="text-xs text-gold">
            National Dex
          </span>
        </div>

        {loading && (
          <p className="py-12 text-center text-muted">
            Loading Pokémon...
          </p>
        )}

        {error && (
          <p role="alert" className="py-12 text-center text-red-400">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {pokemon.map((entry) => (
                <PokemonCard
                  key={entry.id}
                  pokemon={entry}
                  onClick={setSelectedId}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>

            {pokemon.length === 0 && (
              <p className="py-12 text-center text-muted">
                No Pokémon match your filters.
              </p>
            )}

            <div className="mt-10 flex items-center justify-center gap-6">
              <button
                disabled={page <= 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: page - 1,
                  }))
                }
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:border-gold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: page + 1,
                  }))
                }
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:border-gold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
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
