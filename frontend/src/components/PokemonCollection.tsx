
import { useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import {
  addOwnedPokemon,
  updateOwnedPokemon,
  deleteOwnedPokemon,
} from "../services/collection";
import ConfirmModal from "./ConfirmModal";
import type { OwnedPokemon } from "../types/pokemon";
import { formatDateDDMMYYYY, parseDateDDMMYYYY } from "../utils/date";
import Button from "./Button";
import FigureLabel from "./FigureLabel";

interface Props {
  dexEntryId: number;
  ownedPokemon: OwnedPokemon[];
  shinyImage: string | null;
  onChanged: () => Promise<void>;
}

// Lists a Pokémon's shiny specimens and manages collection updates.
export default function PokemonCollection({
  dexEntryId,
  ownedPokemon,
  shinyImage,
  onChanged,
}: Props) {
  const [gameOrigin, setGameOrigin] = useState("");
  const [obtainedAt, setObtainedAt] = useState("");
  const [isInHome, setIsInHome] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pokemonToDelete, setPokemonToDelete] =
    useState<OwnedPokemon | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  async function runAction(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);

    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  // Convert the displayed date to the ISO format expected by the API.
  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isoDate = obtainedAt
      ? parseDateDDMMYYYY(obtainedAt)
      : null;

    if (obtainedAt && !isoDate) {
      setDateError("Enter a valid date in DD/MM/YYYY format");
      return;
    }

    setDateError(null);

    await runAction(async () => {
      await addOwnedPokemon({
        dexEntryId,
        gameOrigin: gameOrigin || null,
        obtainedAt: isoDate,
        isInHome,
      });

      setGameOrigin("");
      setObtainedAt("");
      setIsInHome(false);
    });
  }

  return (
    <section className="@container space-y-3 shape-organic border border-outline bg-canvas p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-lg font-semibold">
          My collection
        </h3>
        <p className="technical-label tabular-nums">
          {ownedPokemon.length} shiny specimen
          {ownedPokemon.length === 1 ? "" : "s"} recorded
        </p>
      </div>

      {error && (
        <p role="alert" className="font-body text-sm text-danger">
          {error}
        </p>
      )}

      {ownedPokemon.length > 0 && (
        <ul className="divide-y divide-outline border border-outline bg-surface">
          {ownedPokemon.map((owned) => {
            const name = owned.nickname || `shiny specimen ${owned.id}`;

            return (
              <li key={owned.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 p-2">
                <span className="grid size-10 place-items-center border border-outline bg-canvas" aria-hidden="true">
                  {shinyImage ? (
                    <img src={shinyImage} alt="" className="size-full object-contain [image-rendering:pixelated]" />
                  ) : (
                    <Sparkles size={16} strokeWidth={1.5} className="text-muted" />
                  )}
                </span>

                <div className="min-w-0 space-y-0.5">
                  {owned.nickname ? (
                    <p className="wrap-anywhere font-display text-sm font-semibold">{owned.nickname}</p>
                  ) : (
                    <FigureLabel prefix="SPEC." number={owned.id} subject="Shiny" className="block" />
                  )}
                  <div className="flex flex-wrap items-baseline gap-x-2 font-mono text-micro text-muted">
                    <span className="min-w-0 wrap-anywhere">{owned.gameOrigin || "Unknown game"}</span>
                    {owned.obtainedAt ? (
                      <time className="tabular-nums" dateTime={owned.obtainedAt.slice(0, 10)}>
                        {formatDateDDMMYYYY(owned.obtainedAt)}
                      </time>
                    ) : (
                      <span>Date unrecorded</span>
                    )}
                  </div>
                  <label className="status min-h-5 cursor-pointer pointer-coarse:min-h-8">
                    <input
                      type="checkbox"
                      checked={owned.isInHome}
                      disabled={saving}
                      aria-label={`Pokémon HOME storage for ${name}`}
                      onChange={(event) => {
                        void runAction(() =>
                          updateOwnedPokemon(owned.id, {
                            isInHome: event.target.checked,
                          })
                        );
                      }}
                      className="bios-checkbox"
                    />
                    <span className={owned.isInHome ? "text-success-text" : "text-muted"}>
                      {owned.isInHome ? "In Pokémon HOME" : "Outside Pokémon HOME"}
                    </span>
                  </label>
                </div>

                <Button
                  variant="danger"
                  type="button"
                  disabled={saving}
                  onClick={() => setPokemonToDelete(owned)}
                  aria-label={`Remove ${name}`}
                  title="Remove shiny"
                  className="btn-icon pointer-fine:size-[26px] pointer-fine:min-h-0"
                >
                  <X size={14} strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        className="space-y-2 border-t border-outline pt-3"
      >
        <h4 className="font-display text-base font-semibold">
          Add a shiny
        </h4>

        <div className="grid gap-2 @xs:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="min-w-0">
            <label htmlFor="game-origin" className="technical-label mb-1 block">
              Game of origin
            </label>
            <input
              id="game-origin"
              value={gameOrigin}
              onChange={(event) => setGameOrigin(event.target.value)}
              placeholder="e.g. Pokémon Scarlet"
              className="field"
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="obtained-at" className="technical-label mb-1 block">
              Date obtained
            </label>
            <input
              id="obtained-at"
              value={obtainedAt}
              onChange={(event) => {
                setObtainedAt(event.target.value);
                if (dateError) setDateError(null);
              }}
              inputMode="numeric"
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className="field"
              aria-invalid={dateError ? true : undefined}
              aria-describedby={dateError ? "obtained-at-error" : undefined}
            />
            {dateError && (
              <p id="obtained-at-error" role="alert" className="mt-1 font-body text-xs text-danger">
                {dateError}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-h-9 cursor-pointer items-center gap-2 font-body text-xs font-medium">
            <input
              type="checkbox"
              checked={isInHome}
              onChange={(event) => setIsInHome(event.target.checked)}
              className="bios-checkbox"
            />
            In Pokémon HOME
          </label>

          <Button variant="accent" type="submit" disabled={saving}>
            <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
            {saving ? "Saving..." : "Add to collection"}
          </Button>
        </div>
      </form>

      <ConfirmModal
        open={pokemonToDelete !== null}
        title="Remove shiny Pokémon?"
        description={`Are you sure you want to remove ${
          pokemonToDelete?.nickname || "this shiny Pokémon"
        } from your collection? This will update your Pokédex progress and cannot be undone.`}
        confirmLabel="Remove Pokémon"
        variant="danger"
        loading={saving}
        onCancel={() => setPokemonToDelete(null)}
        onConfirm={() => {
          if (!pokemonToDelete) return;

          void runAction(async () => {
            await deleteOwnedPokemon(pokemonToDelete.id);
            setPokemonToDelete(null);
          });
        }}
      />
    </section>
  );
}
