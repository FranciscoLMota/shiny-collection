
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import { getPokemon } from "../services/pokemon";
import { createHuntPhase } from "../services/huntPhases";
import type { DexEntry } from "../types/pokemon";
import Button from "./Button";

interface Props {
  huntId: number;
  targetDexEntryId: number;
  onClose: () => void;
  onRecorded: () => Promise<void>;
}

// Records a found shiny as a hunt phase and adds it to the collection.
export default function RecordPhaseModal({
  huntId,
  targetDexEntryId,
  onClose,
  onRecorded,
}: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<DexEntry[]>([]);
  const [selected, setSelected] = useState<DexEntry | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selected || !search.trim()) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await getPokemon(
          { search, limit: 20 },
          controller.signal
        );
        setResults(
          response.data.filter((entry) => entry.id !== targetDexEntryId)
        );
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
  }, [search, selected, targetDexEntryId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || saving) return;

    setSaving(true);
    setError(null);

    try {
      await createHuntPhase(huntId, {
        dexEntryId: selected.id,
        addToCollection: true,
        notes,
      });
      await onRecorded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record phase");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bios-backdrop  p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Record shiny phase"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto modal-surface"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-micro uppercase tracking-widest text-ink">
              Shiny found
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              Record a phase
            </h2>
          </div>
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-0 border-0 bg-transparent p-0 font-body text-xs font-medium text-muted hover:bg-transparent hover:text-ink"
          >
            Close ✕
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="phase-search" className="mb-2 block font-body text-xs font-medium text-muted">
              Which shiny did you find?
            </label>

            {selected ? (
              <div className="flex items-center gap-3 shape-angular border border-ink bg-canvas p-3">
                <img
                  src={selected.spriteShiny ?? selected.artworkShiny ?? ""}
                  alt=""
                  className="h-14 w-14 object-contain"
                />
                <span className="flex-1 font-medium">
                  {selected.displayName}
                </span>
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
                  id="phase-search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setResults([]);
                  }}
                  placeholder="Search by name or Dex number"
                  className="field"
                />
                {results.length > 0 && (
                  <div className="mt-2 max-h-52 overflow-y-auto shape-angular border border-outline bg-canvas">
                    {results.map((entry) => (
                      <Button
                        key={entry.id}
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setSelected(entry);
                          setResults([]);
                        }}
                        className="flex w-full items-center gap-3 border-b border-outline p-2 text-left font-body text-xs font-medium text-ink hover:bg-elevated"
                      >
                        <img
                          src={entry.spriteShiny ?? entry.spriteDefault ?? ""}
                          alt=""
                          className="h-10 w-10 object-contain"
                        />
                        <span className="font-body text-xs font-medium">
                          #{entry.species.nationalDexNumber} {entry.displayName}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="phase-notes" className="mb-2 block font-body text-xs font-medium text-muted">
              Notes (optional)
            </label>
            <textarea
              id="phase-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Where did you find it?"
              className="field"
            />
          </div>

          {error && <p role="alert" className="font-body text-sm text-danger">{error}</p>}

          <Button
            variant="accent"
            type="submit"
            disabled={!selected || saving}
            className="w-full"
          >
            {saving ? (
              "Recording..."
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                <Sparkles strokeWidth={1.5} size={16} aria-hidden="true" />
                Record shiny phase
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>,
    document.body
  );
}
