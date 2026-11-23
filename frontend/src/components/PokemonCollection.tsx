
import { useState } from "react";
import {
  addOwnedPokemon,
  updateOwnedPokemon,
  deleteOwnedPokemon,
} from "../services/collection";
import ConfirmModal from "./ConfirmModal";
import type { OwnedPokemon } from "../types/pokemon";

interface Props {
  dexEntryId: number;
  ownedPokemon: OwnedPokemon[];
  onChanged: () => Promise<void>;
}

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

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(async () => {
      await addOwnedPokemon({
        dexEntryId,
        gameOrigin: gameOrigin || null,
        obtainedAt: obtainedAt || null,
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
        <p className="mt-1 text-sm text-muted">
          {ownedPokemon.length} shiny specimen
          {ownedPokemon.length === 1 ? "" : "s"} recorded
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
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
                  <p className="font-medium">
                    {owned.nickname || `Shiny #${owned.id}`}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {owned.gameOrigin || "Unknown game"}
                    {owned.obtainedAt &&
                      ` · ${owned.obtainedAt.slice(0, 10)}`}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setPokemonToDelete(owned)}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <label className="mt-4 flex items-center gap-3 text-sm">
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

      <form onSubmit={handleAdd} className="space-y-4 border-t border-border pt-5">
        <h4 className="font-display font-semibold">
          Add a shiny
        </h4>

        <div>
          <label htmlFor="game-origin" className="mb-2 block text-xs text-muted">
            Game of origin
          </label>
          <input
            id="game-origin"
            value={gameOrigin}
            onChange={(event) => setGameOrigin(event.target.value)}
            placeholder="e.g. Pokémon Scarlet"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>

        <div>
          <label htmlFor="obtained-at" className="mb-2 block text-xs text-muted">
            Date obtained
          </label>
          <input
            id="obtained-at"
            type="date"
            value={obtainedAt}
            onChange={(event) => setObtainedAt(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isInHome}
            onChange={(event) => setIsInHome(event.target.checked)}
            className="accent-[#69a884]"
          />
          Already deposited in Pokémon HOME
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-obsidian transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add to collection"}
        </button>
      </form>

      <ConfirmModal
        open={pokemonToDelete !== null}
        title="Remove shiny Pokémon?"
        description={`Are you sure you want to remove ${pokemonToDelete?.nickname || "this shiny Pokémon"
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
