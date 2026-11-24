
import { useCallback, useEffect, useMemo, useState } from "react";
import HuntCard from "../components/HuntCard";
import CreateHuntForm from "../components/CreateHuntForm";
import { getHunts } from "../services/hunt";
import type { Hunt, HuntStatus } from "../types/hunt";
import Button from "../components/Button";

type HuntFilter = "ALL" | HuntStatus;

const filters: { label: string; value: HuntFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Planned", value: "PLANNED" },
  { label: "Paused", value: "PAUSED" },
  { label: "Completed", value: "COMPLETED" },
];

export default function HuntBoardPage() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [filter, setFilter] = useState<HuntFilter>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHunts = useCallback(async () => {
    try {
      const data = await getHunts();
      setHunts(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Unable to load hunts";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHunts().catch(() => {});
  }, [loadHunts]);

  const visibleHunts = useMemo(() => {
    if (filter === "ALL") return hunts;
    return hunts.filter((hunt) => hunt.status === filter);
  }, [hunts, filter]);

  const activeCount = hunts.filter(
    (hunt) => hunt.status === "ACTIVE"
  ).length;

  const completedCount = hunts.filter(
    (hunt) => hunt.status === "COMPLETED"
  ).length;

  const totalEncounters = hunts.reduce(
    (total, hunt) => total + hunt.encounters,
    0
  );

  return (
    <main className="min-h-screen bg-obsidian px-4 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-micro uppercase tracking-widest text-gold">
              Shiny Archive / Hunts
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Hunt Board
            </h1>
            <p className="mt-3 text-muted">
              Every encounter brings you closer.
            </p>
          </div>

          <Button
            variant="accent"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-gold px-5 py-3 font-body text-xs font-medium text-obsidian hover:opacity-90"
          >
            + New hunt
          </Button>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["Active hunts", activeCount],
            ["Total encounters", totalEncounters],
            ["Completed hunts", completedCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <p className="font-mono text-micro uppercase tracking-widest text-muted">{label}</p>
              <p className="mt-2 font-display text-3xl tabular-nums">
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? "accent" : "outline"}
              onClick={() => setFilter(option.value)}
              className={`rounded-lg border px-4 py-2 font-body text-xs font-medium ${
                filter === option.value
                  ? "border-gold bg-gold text-obsidian"
                  : "border-border bg-surface text-muted hover:border-gold"
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {loading && (
          <p className="py-12 text-center text-muted">
            Loading hunts...
          </p>
        )}

        {error && (
          <p role="alert" className="mb-5 text-red-400">
            {error}
          </p>
        )}

        {!loading && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleHunts.map((hunt) => (
              <HuntCard
                key={hunt.id}
                hunt={hunt}
                onChanged={loadHunts}
              />
            ))}
          </div>
        )}

        {!loading && !error && visibleHunts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-xl font-semibold">
              No hunts here yet
            </p>
            <p className="mt-2 font-body text-sm text-muted">
              Create a hunt or choose another status.
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <CreateHuntForm
          onCreated={loadHunts}
          onClose={() => setShowForm(false)}
        />
      )}
    </main>
  );
}
