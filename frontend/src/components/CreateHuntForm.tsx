
import { useEffect, useState } from "react";
import { getPokemon } from "../services/pokemon";
import { createHunt } from "../services/hunt";
import type { DexEntry } from "../types/pokemon";
import type { HuntStatus } from "../types/hunt";

interface Props {
  onCreated: () => Promise<void>;
  onClose: () => void;
}

const fieldClass =
  "w-full rounded-lg border border-border bg-obsidian " +
  "px-3 py-2.5 text-sm outline-none focus:border-gold";

export default function CreateHuntForm({
  onCreated,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<DexEntry[]>([]);
  const [selected, setSelected] = useState<DexEntry | null>(null);
  const [game, setGame] = useState("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<HuntStatus>("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!search.trim() || selected) {
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        const result = await getPokemon(
          { search, limit: 15 },
          controller.signal
        );
        if (!controller.signal.aborted) {
          setResults(result.data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to search Pokémon");
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search, selected]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected) {
      setError("Select a Pokémon first");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createHunt({
        dexEntryId: selected.id,
        game,
        method,
        notes,
        status,
      });

      await onCreated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create hunt"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create shiny hunt"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">
            New shiny hunt
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-white"
          >
            Close ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-muted">
              Pokémon
            </label>

            {selected ? (
              <div className="flex items-center justify-between rounded-lg border border-gold bg-obsidian p-3">
                <span>{selected.displayName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setSearch("");
                    setResults([]);
                  }}
                  className="text-xs text-gold"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setResults([]);
                  }}
                  placeholder="Search Pokémon..."
                  className={fieldClass}
                />

                {search.trim() && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-obsidian">
                    {results.map((pokemon) => (
                      <button
                        key={pokemon.id}
                        type="button"
                        onClick={() => {
                          setSelected(pokemon);
                          setResults([]);
                        }}
                        className="flex w-full items-center gap-3 border-b border-border p-2 text-left text-sm hover:bg-surface-hover"
                      >
                        <img
                          src={pokemon.spriteShiny ?? pokemon.spriteDefault ?? ""}
                          alt=""
                          className="h-10 w-10 object-contain [image-rendering:pixelated]"
                        />
                        <span>
                          #{pokemon.species.nationalDexNumber}{" "}
                          {pokemon.displayName}
                        </span>
                      </button>
                    ))}
                    {results.length === 0 && (
                      <p className="p-3 text-xs text-muted">
                        No results yet
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">
              Game
            </label>
            <input
              value={game}
              onChange={(e) => setGame(e.target.value)}
              placeholder="e.g. Pokémon Scarlet"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">
              Hunting method
            </label>
            <input
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="e.g. Masuda Method, Soft Resets"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">
              Initial status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as HuntStatus)}
              className={fieldClass}
            >
              <option value="ACTIVE">Active</option>
              <option value="PLANNED">Planned</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional hunting notes..."
              className={fieldClass}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !selected}
            className="w-full rounded-lg bg-gold px-4 py-3 font-semibold text-obsidian disabled:opacity-40"
          >
            {saving ? "Creating..." : "Create hunt"}
          </button>
        </form>
      </div>
    </div>
  );
}
