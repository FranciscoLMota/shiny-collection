
import { useEffect, useRef, useState } from "react";
import confetti from "@hiseb/confetti";
import { Sparkles } from "lucide-react";
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
import Button from "./Button";


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

// Displays a hunt, its encounter controls, and its phase history.
export default function HuntCard({ hunt, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLElement>(null);

  const pokemon = hunt.dexEntry;
  const sprite =
    pokemon.spriteShiny ?? pokemon.artworkShiny;
  const [phases, setPhases] = useState<HuntPhase[]>([]);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shinyTransition, setShinyTransition] = useState(false);
  const [encounterDraftState, setEncounterDraftState] = useState({
    count: hunt.encounters,
    value: String(hunt.encounters),
  });
  const [encounterStep, setEncounterStep] = useState("1");

  const encounterDraft =
    encounterDraftState.count === hunt.encounters
      ? encounterDraftState.value
      : String(hunt.encounters);

  function setEncounterDraft(value: string) {
    setEncounterDraftState({ count: hunt.encounters, value });
  }

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
    let active = true;

    getHuntPhases(hunt.id)
      .then((data) => {
        if (active) {
          setPhases(data);
          setPhaseError(null);
        }
      })
      .catch(() => {
        if (active) setPhaseError("Unable to load phase history");
      });

    return () => {
      active = false;
    };
  }, [hunt.id]);

  const isCompleted = hunt.status === "COMPLETED";

  async function refreshAfterPhase() {
    await loadPhases();
    await onChanged();
  }

  async function saveEncounterCount() {
    if (busy) return;

    const nextCount = Number(encounterDraft);
    if (
      !Number.isSafeInteger(nextCount) ||
      nextCount < 0 ||
      nextCount > 2147483647
    ) {
      setEncounterDraft(String(hunt.encounters));
      setError("Encounter count must be a whole number from 0 to 2147483647");
      return;
    }

    if (nextCount === hunt.encounters) return;

    await perform(() => updateHunt(hunt.id, { encounters: nextCount }));
  }
  async function perform(
    action: () => Promise<unknown>,
    celebrate = false
  ) {
    setBusy(true);
    setError(null);

    try {
      if (celebrate) {
        setShinyTransition(true);
      }
      const result = await action();
      if (
        result &&
        typeof result === "object" &&
        "data" in result &&
        result.data &&
        typeof result.data === "object" &&
        "encounters" in result.data &&
        typeof result.data.encounters === "number"
      ) {
        setEncounterDraft(String(result.data.encounters));
      }
      if (celebrate) {
        const rect = cardRef.current?.getBoundingClientRect();
        confetti({
          position: rect
            ? {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              }
            : undefined,
          count: 140,
          size: 1,
          velocity: 220,
          fade: true,
          color: ["#c5a46d", "#ffffff", "#69a884", "#60a5fa", "#f472b6"],
        });
        await new Promise((resolve) =>
          window.setTimeout(resolve, 850)
        );
      }
      await onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      if (celebrate) {
        setShinyTransition(false);
      }
      setBusy(false);
    }
  }

  return (
    <article
      ref={cardRef}
      className={`
        relative isolate overflow-hidden rounded-xl border border-border bg-surface p-5
        ${shinyTransition ? "hunt-shiny-transition" : ""}
      `}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="font-mono text-micro uppercase tracking-widest text-muted">
          #{String(pokemon.species.nationalDexNumber).padStart(4, "0")}
        </span>
        <div className="flex items-center gap-2">
          {hunt.status === "COMPLETED" ? (
            <span
              className={`rounded-md border px-2.5 py-1 font-body text-xs font-medium ${statusStyles[hunt.status]}`}
            >
              {hunt.status}
            </span>
          ) : (
            <Button
              variant={hunt.status === "ACTIVE" ? "outline" : "accent"}
              type="button"
              disabled={busy}
              onClick={() =>
                void perform(() =>
                  updateHunt(hunt.id, {
                    status: hunt.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                  })
                )
              }
              className={`rounded-md border px-3 py-1.5 font-body text-xs font-medium transition-colors disabled:opacity-50 ${
                hunt.status === "ACTIVE"
                  ? "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20"
                  : "border-success/40 bg-success/10 text-success hover:bg-success/20"
              }`}
            >
              {hunt.status === "ACTIVE" ? "Stop" : "Start"}
            </Button>
          )}
          <Button
            variant="danger"
            type="button"
            disabled={busy}
            onClick={() => setShowDeleteModal(true)}
            aria-label={`Delete ${pokemon.displayName} hunt`}
            title="Delete hunt"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-red-400/40 font-body text-xs font-medium text-red-400 transition-colors hover:border-red-400 hover:bg-red-400/10 disabled:opacity-50"
          >
            ×
          </Button>
        </div>
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
          <h3 className="truncate font-display text-base font-semibold">
            {pokemon.displayName}
          </h3>
          <p className="mt-1 font-body text-sm text-muted">
            {hunt.game || "Game not specified"}
          </p>
          <p className="mt-1 font-body text-xs text-muted">
            {hunt.method || "Method not specified"}
          </p>
        </div>
      </div>

      <div className="my-6 rounded-lg border border-border bg-obsidian p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-left">
            <p className="font-mono text-micro uppercase tracking-widest text-muted">
              Encounters
            </p>
            {isCompleted ? (
              <p className="mt-2 font-display text-3xl tabular-nums">
                {hunt.encounters.toLocaleString()}
              </p>
            ) : (
              <input
                type="number"
                min="0"
                max="2147483647"
                step="1"
                value={encounterDraft}
                disabled={busy}
                onChange={(event) => setEncounterDraft(event.target.value)}
                onBlur={() => void saveEncounterCount()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                  if (event.key === "Escape") {
                    setEncounterDraft(String(hunt.encounters));
                  }
                }}
                aria-label="Encounter count"
                className="mt-2 w-full bg-transparent font-display text-3xl tabular-nums outline-none focus:text-gold disabled:cursor-not-allowed"
              />
            )}
          </div>

          <div className="text-right">
            <p className="font-mono text-micro uppercase tracking-widest text-muted">
              Phases
            </p>
            <p className="mt-2 font-display text-3xl tabular-nums">
              {phases.length.toLocaleString()}
            </p>
          </div>
        </div>

        {!isCompleted && (
          <div className="mt-4 grid grid-cols-[1fr_5rem_1fr] items-stretch gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={busy || hunt.status !== "ACTIVE"}
              onClick={() => {
                const amount = Number(encounterStep);
                if (Number.isSafeInteger(amount) && amount > 0) {
                  const current = Number(encounterDraft);
                  if (Number.isSafeInteger(current)) {
                    setEncounterDraft(
                      String(Math.max(0, current - amount))
                    );
                  }
                  void perform(() => addEncounters(hunt.id, -amount));
                }
              }}
              className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-xs font-medium text-white hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
            >
              −
            </Button>

            <input
              type="number"
              min="1"
              max="10000"
              step="1"
              value={encounterStep}
              disabled={busy || hunt.status !== "ACTIVE"}
              onChange={(event) => setEncounterStep(event.target.value)}
              aria-label="Encounter adjustment value"
              className="min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-center font-body text-xs font-medium outline-none focus:border-gold disabled:opacity-30"
            />

            <Button
              variant="outline"
              type="button"
              disabled={busy || hunt.status !== "ACTIVE"}
              onClick={() => {
                const amount = Number(encounterStep);
                if (Number.isSafeInteger(amount) && amount > 0) {
                  const current = Number(encounterDraft);
                  if (Number.isSafeInteger(current)) {
                    setEncounterDraft(
                      String(Math.min(2147483647, current + amount))
                    );
                  }
                  void perform(() => addEncounters(hunt.id, amount));
                }
              }}
              className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-xs font-medium text-white hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
            >
              + 
            </Button>
          </div>
        )}

        {phaseError && (
          <p role="alert" className="mt-3 font-body text-xs text-red-400">
            {phaseError}
          </p>
        )}

        {phases.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-3 font-mono text-micro uppercase tracking-widest text-muted">
              Phase history
            </p>
            <div className="space-y-3">
              {phases.map((phase) => (
                <div key={phase.id} className="flex items-center gap-3">
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
                    <p className="truncate font-body text-sm font-medium">
                      Phase {phase.phaseNumber} · {phase.dexEntry.displayName}
                    </p>
                    <p className="font-body text-xs text-muted">
                      {phase.encounters.toLocaleString()} encounters
                    </p>
                  </div>
                  {phase.ownedPokemonId && (
                    <span className="font-body text-xs font-medium text-success">Collected</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


      </div>

      {hunt.status !== "COMPLETED" && (
        <div className="grid grid-cols-4 gap-2">
          {hunt.status === "ACTIVE" && (
            <Button
              variant="accent"
              type="button"
              disabled={busy}
              onClick={() => setShowPhaseModal(true)}
              className="col-span-1 rounded-lg border border-gold/50 bg-gold/10 px-2 py-2.5 font-body text-xs font-medium text-gold hover:bg-gold/20 disabled:opacity-40"
            >
              <span className="flex items-center justify-center gap-1">
                <Sparkles size={14} aria-hidden="true" />
                Phase
              </span>
            </Button>
          )}
          <Button
            variant="accent"
            type="button"
            disabled={busy}
            onClick={() =>
              void perform(
                () => completeHunt(hunt.id, true),
                true
              )
            }
            className={`${hunt.status === "ACTIVE" ? "col-span-3" : "col-span-4"} rounded-lg bg-gold px-4 py-2.5 font-body text-xs font-medium text-obsidian hover:opacity-90 disabled:opacity-50`}
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={16} aria-hidden="true" />
              Complete hunt
            </span>
          </Button>
        </div>
      )}

      {hunt.status === "COMPLETED" && (
        <p className="rounded-lg border border-success/30 bg-success/10 p-3 text-center font-body text-sm text-success">
          Hunt completed!
        </p>
      )}

      {hunt.notes && (
        <p className="mt-4 font-body text-sm text-muted">{hunt.notes}</p>
      )}

      {error && (
        <p role="alert" className="mt-3 font-body text-sm text-red-400">
          {error}
        </p>
      )}

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
    </article>
  );
}
