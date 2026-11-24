
import { useEffect, useState } from "react";
import { getPokemon } from "../services/pokemon";
import { createHunt } from "../services/hunt";
import type { DexEntry } from "../types/pokemon";
import type { HuntStatus } from "../types/hunt";
import Button from "./Button";

interface Props {
  onCreated: () => Promise<void>;
  onClose: () => void;
}

const fieldClass = "field";

// Searches for a Pokémon and creates a hunt with its initial settings.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bios-backdrop p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create shiny hunt"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto modal-surface"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            New shiny hunt
          </h2>
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            className="min-h-0 border-0 bg-transparent p-0 font-body text-xs font-medium text-muted hover:bg-transparent hover:text-ink"
          >
            Close ✕
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-2 block font-body text-xs font-medium text-muted">
              Pokémon
            </label>

            {selected ? (
              <div className="flex items-center justify-between shape-angular border border-ink bg-canvas p-3">
                <span>{selected.displayName}</span>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setSearch("");
                    setResults([]);
                  }}
                  className="min-h-0 border-0 bg-transparent p-0 font-body text-xs font-medium text-ink hover:bg-transparent"
                >
                  Change
                </Button>
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
                  <div className="mt-2 max-h-48 overflow-y-auto shape-angular border border-outline bg-canvas">
                    {results.map((pokemon) => (
                      <Button
                        key={pokemon.id}
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setSelected(pokemon);
                          setResults([]);
                        }}
                        className="flex w-full items-center gap-3 border-b border-outline p-2 text-left font-body text-xs font-medium text-ink hover:bg-elevated"
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
                      </Button>
                    ))}
                    {results.length === 0 && (
                      <p className="p-3 font-body text-xs text-muted">
                        No results yet
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="mb-2 block font-body text-xs font-medium text-muted">
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
            <label className="mb-2 block font-body text-xs font-medium text-muted">
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
            <label className="mb-2 block font-body text-xs font-medium text-muted">
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
            <label className="mb-2 block font-body text-xs font-medium text-muted">
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
            <p role="alert" className="font-body text-sm text-danger">
              {error}
            </p>
          )}

          <Button
            variant="accent"
            type="submit"
            disabled={saving || !selected}
            className="w-full"
          >
            {saving ? "Creating..." : "Create hunt"}
          </Button>
        </form>
      </div>
    </div>
  );
}
