
import { useState } from "react";
import {
  addOwnedPokemon,
  updateOwnedPokemon,
  deleteOwnedPokemon,
} from "../services/collection";
import ConfirmModal from "./ConfirmModal";
import type { OwnedPokemon } from "../types/pokemon";
import { formatDateDDMMYYYY, parseDateDDMMYYYY } from "../utils/date";
import Button from "./Button";

interface Props {
  dexEntryId: number;
  ownedPokemon: OwnedPokemon[];
  onChanged: () => Promise<void>;
}

// Lists a Pokémon's shiny specimens and manages collection updates.
export default function PokemonCollection({
  dexEntryId,
  ownedPokemon,
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
    <section className="space-y-5 rounded-xl border border-border bg-obsidian p-5">
      <div>
        <h3 className="font-display text-xl font-semibold">
          My collection
        </h3>
        <p className="mt-1 font-body text-sm text-muted">
          {ownedPokemon.length} shiny specimen
          {ownedPokemon.length === 1 ? "" : "s"} recorded
        </p>
      </div>

      {error && (
        <p role="alert" className="font-body text-sm text-red-400">
          {error}
        </p>
      )}

      {ownedPokemon.length > 0 && (
        <div className="space-y-3">
          {ownedPokemon.map((owned) => (
            <div
              key={owned.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-sm font-medium">
                    {owned.nickname || `Shiny #${owned.id}`}
                  </p>
                  <p className="mt-1 font-body text-xs text-muted">
                    {owned.gameOrigin || "Unknown game"}
                    {owned.obtainedAt &&
                      ` · ${formatDateDDMMYYYY(owned.obtainedAt)}`}
                  </p>
                </div>

                <Button
                  variant="danger"
                  type="button"
                  disabled={saving}
                  onClick={() => setPokemonToDelete(owned)}
                  className="min-h-0 border-0 bg-transparent p-0 font-body text-xs font-medium text-red-400 hover:bg-transparent hover:text-red-300 disabled:opacity-50"
                >
                  Remove
                </Button>
              </div>

              <label className="mt-4 flex items-center gap-3 font-body text-xs font-medium">
                <input
                  type="checkbox"
                  checked={owned.isInHome}
                  disabled={saving}
                  onChange={(event) => {
                    void runAction(() =>
                      updateOwnedPokemon(owned.id, {
                        isInHome: event.target.checked,
                      })
                    );
                  }}
                  className="accent-[#69a884]"
                />
                Deposited in Pokémon HOME
              </label>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="space-y-4 border-t border-border pt-5"
      >
        <h4 className="font-display text-xl font-semibold">
          Add a shiny
        </h4>

        <div>
          <label htmlFor="game-origin" className="mb-2 block font-body text-xs font-medium text-muted">
            Game of origin
          </label>
          <input
            id="game-origin"
            value={gameOrigin}
            onChange={(event) => setGameOrigin(event.target.value)}
            placeholder="e.g. Pokémon Scarlet"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-body text-xs font-medium outline-none focus:border-gold"
          />
        </div>

        <div>
          <label htmlFor="obtained-at" className="mb-2 block font-body text-xs font-medium text-muted">
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
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-body text-xs font-medium outline-none focus:border-gold"
          />
          {dateError && (
            <p role="alert" className="mt-2 font-body text-xs text-red-400">
              {dateError}
            </p>
          )}
        </div>

        <label className="flex items-center gap-3 font-body text-xs font-medium">
          <input
            type="checkbox"
            checked={isInHome}
            onChange={(event) => setIsInHome(event.target.checked)}
            className="accent-[#69a884]"
          />
          Already deposited in Pokémon HOME
        </label>

        <Button
          variant="accent"
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-gold px-4 py-3 font-body text-xs font-medium text-obsidian transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add to collection"}
        </Button>
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
