
import { useEffect, useState } from "react";
import type { Hunt, HuntStatus } from "../types/hunt";
import {
  addEncounters,
  updateHunt,
  completeHunt,
  deleteHunt,
} from "../services/hunt";
import RecordPhaseModal from "./RecordPhaseModal";
import { getHuntPhases } from "../services/huntPhases";
import type { HuntPhase } from "../types/huntPhases";
import ConfirmModal from "./ConfirmModal";


interface Props {
  hunt: Hunt;
  onChanged: () => Promise<void>;
}

const statusStyles: Record<HuntStatus, string> = {
  PLANNED: "text-muted border-border",
  ACTIVE: "text-success border-success/40",
  PAUSED: "text-gold border-gold/40",
  COMPLETED: "text-blue-400 border-blue-400/40",
};

export default function HuntCard({ hunt, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pokemon = hunt.dexEntry;
  const sprite =
    pokemon.spriteShiny ?? pokemon.artworkShiny;
  const [phases, setPhases] = useState<HuntPhase[]>([]);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [addToCollection, setAddToCollection] = useState(true);

  async function loadPhases() {
    try {
      const data = await getHuntPhases(hunt.id);
      setPhases(data);
      setPhaseError(null);
    } catch {
      setPhaseError("Unable to load phase history");
    }
  }

  useEffect(() => {
    void loadPhases();
  }, [hunt.id]);

  const lastPhase = phases[phases.length - 1];

  const isCompleted = hunt.status === "COMPLETED";

  const currentPhase = phases.length + 1;

  const currentPhaseEncounters = Math.max(
    0,
    hunt.encounters - (lastPhase?.totalEncounters ?? 0)
  );

  async function refreshAfterPhase() {
    await loadPhases();
    await onChanged();
  }


  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);

    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setBusy(false);
    }
  }

  function handleComplete() {
    const addToCollection = window.confirm(
      "Add the shiny Pokémon to your collection?\n\n" +
      "OK: Complete and add to collection\n" +
      "Cancel: Choose another completion option"
    );

    if (!addToCollection) {
      const completeOnly = window.confirm(
        "Complete this hunt without adding a Pokémon?"
      );

      if (!completeOnly) return;
    }

    void perform(() => completeHunt(hunt.id, addToCollection));
  }

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="font-mono text-xs text-muted">
          #{String(pokemon.species.nationalDexNumber).padStart(4, "0")}
        </span>

        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyles[hunt.status]}`}
        >
          {hunt.status}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-obsidian">
          {sprite ? (
            <img
              src={sprite}
              alt={`Shiny ${pokemon.displayName}`}
              className="h-24 w-24 object-contain [image-rendering:pixelated]"
            />
          ) : (
            <span className="text-muted">?</span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-bold">
            {pokemon.displayName}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {hunt.game || "Game not specified"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {hunt.method || "Method not specified"}
          </p>
        </div>
      </div>

      <div className="my-6 rounded-lg border border-border bg-obsidian p-4">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">
          Encounters
        </p>
        <p className="mt-2 font-display text-4xl font-bold tabular-nums">
          {hunt.encounters.toLocaleString()}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[1, 10, 100].map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={busy || hunt.status !== "ACTIVE"}
              onClick={() =>
                void perform(() => addEncounters(hunt.id, amount))
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
            >
              +{amount}
            </button>
          ))}
        </div>


        {(!isCompleted || phases.length > 0) && (
          <section className="my-5 rounded-lg border border-border bg-obsidian p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted">
                  {isCompleted ? "Final phase" : "Current phase"}
                </p>

                <p className="mt-1 font-display text-2xl font-bold">
                  Phase {currentPhase}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted">
                  {isCompleted ? "Final phase encounters" : "Phase encounters"}
                </p>

                <p className="font-display text-2xl font-bold text-gold tabular-nums">
                  {currentPhaseEncounters.toLocaleString()}
                </p>
              </div>
            </div>

            {hunt.status === "ACTIVE" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowPhaseModal(true)}
                className="w-full rounded-lg border border-gold/50 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold hover:bg-gold/20 disabled:opacity-40"
              >
                ✦ Found another shiny
              </button>
            )}

            {phaseError && (
              <p role="alert" className="mt-3 text-xs text-red-400">
                {phaseError}
              </p>
            )}

            {phases.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
                  Phase history
                </p>

                <div className="space-y-3">
                  {phases.map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-center gap-3"
                    >
                      <img
                        src={
                          phase.dexEntry.spriteShiny ??
                          phase.dexEntry.artworkShiny ??
                          ""
                        }
                        alt=""
                        className="h-10 w-10 object-contain"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          Phase {phase.phaseNumber} ·{" "}
                          {phase.dexEntry.displayName}
                        </p>

                        <p className="text-xs text-muted">
                          {phase.encounters.toLocaleString()} encounters
                        </p>
                      </div>

                      {phase.ownedPokemonId && (
                        <span className="text-xs text-success">
                          Collected
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}


      </div>

      {hunt.status !== "COMPLETED" && (
        <div className="space-y-3">
          <label className="block text-xs text-muted">
            Hunt status
          </label>

          <select
            value={hunt.status}
            disabled={busy}
            onChange={(event) =>
              void perform(() =>
                updateHunt(hunt.id, {
                  status: event.target.value as HuntStatus,
                })
              )
            }
            className="w-full rounded-lg border border-border bg-obsidian px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setAddToCollection(true);
              setShowCompleteModal(true);
            }}
            className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-obsidian hover:opacity-90 disabled:opacity-50"
          >
            ✦ Complete hunt
          </button>
        </div>
      )}

      {hunt.status === "COMPLETED" && (
        <p className="rounded-lg border border-success/30 bg-success/10 p-3 text-center text-sm text-success">
          Hunt completed!
        </p>
      )}

      {hunt.notes && (
        <p className="mt-4 text-sm text-muted">{hunt.notes}</p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => setShowDeleteModal(true)}
          className="text-xs text-muted transition-colors hover:text-red-400 disabled:opacity-50"
        >
          Delete hunt
        </button>
      </div>

      {showPhaseModal && (
        <RecordPhaseModal
          huntId={hunt.id}
          targetDexEntryId={hunt.dexEntryId}
          onClose={() => setShowPhaseModal(false)}
          onRecorded={refreshAfterPhase}
        />
      )}

      <ConfirmModal
        open={showDeleteModal}
        title="Delete this hunt?"
        description={`Are you sure you want to delete your ${hunt.dexEntry.displayName} hunt? This will permanently remove its encounter count and phase history. Pokémon already added to your collection will remain there.`}
        confirmLabel="Delete hunt"
        variant="danger"
        loading={busy}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          void perform(async () => {
            await deleteHunt(hunt.id);
            setShowDeleteModal(false);
          });
        }}
      />


      <ConfirmModal
        open={showCompleteModal}
        title="Shiny found!"
        description={`Congratulations on completing your ${hunt.dexEntry.displayName} hunt! You recorded ${hunt.encounters.toLocaleString()} encounters.`}
        confirmLabel="Complete hunt"
        variant="default"
        loading={busy}
        onCancel={() => setShowCompleteModal(false)}
        onConfirm={() => {
          void perform(async () => {
            await completeHunt(hunt.id, addToCollection);
            setShowCompleteModal(false);
          });
        }}
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-obsidian p-4">
          <input
            type="checkbox"
            checked={addToCollection}
            onChange={(event) => setAddToCollection(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#c5a46d]"
          />

          <span>
            <span className="block text-sm font-medium text-white">
              Add to my shiny collection
            </span>

            <span className="mt-1 block text-xs leading-5 text-muted">
              Creates a new shiny specimen in your National Pokédex.
              Uncheck this if you've already recorded the Pokémon.
            </span>
          </span>
        </label>
      </ConfirmModal>

    </article>
  );
}
