
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HuntCard from "../components/HuntCard";
import CreateHuntForm from "../components/CreateHuntForm";
import { getHunts } from "../services/hunt";
import type { Hunt, HuntStatus } from "../types/hunt";
import Button from "../components/Button";
import { GraphicMark } from "../components/GraphicMark";
import SystemLoading from "../components/SystemLoading";
import ScrambleNumber from "../components/ScrambleNumber";
import { delayForDevLoadingPreview } from "../utils/devLoadingPreview";

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
  const isInitialLoad = useRef(true);

  const loadHunts = useCallback(async () => {
    const previewInitialLoad = isInitialLoad.current;
    isInitialLoad.current = false;

    try {
      const data = await getHunts();
      if (previewInitialLoad) {
        await delayForDevLoadingPreview();
      }
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
    <main className="page-enter flex-1 bg-canvas px-4 py-6 text-ink sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="bios-heading mb-6 flex flex-wrap items-end justify-between gap-4">
          <GraphicMark variant="frame" className="bios-heading-mark" />
          <div>
            <span className="section-index" aria-hidden="true">02</span>
            <p className="mb-2 font-mono text-micro uppercase tracking-widest text-ink">
              SPON / Hunt Observations
            </p>
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl">
              Hunt Board
            </h1>
            <p className="mt-3 text-muted">
              Every encounter brings you closer.
            </p>
          </div>

          <Button
            variant="accent"
            onClick={() => setShowForm(true)}
          >
            + New hunt
          </Button>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["Active hunts", activeCount],
            ["Total encounters", totalEncounters],
            ["Completed hunts", completedCount],
          ].map(([label, value], index) => (
            <div
              key={label}
              className="data-block-enter panel border-t-2 border-t-ink p-3"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <p className="font-mono text-micro uppercase tracking-widest text-muted">{label}</p>
              <p className="mt-2 font-body text-3xl tabular-nums">
                <ScrambleNumber value={Number(value)} delayMs={index * 80} />
              </p>
            </div>
          ))}
        </div>

        <div role="group" aria-label="Hunt status" className="mb-4 flex flex-wrap gap-1">
          {filters.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className="filter-option"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {loading && <SystemLoading className="py-12" />}

        {error && (
          <p role="alert" className="mb-5 text-danger">
            {error}
          </p>
        )}

        {!loading && (
          <div
            key={filter}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {visibleHunts.map((hunt, index) => (
              <HuntCard
                key={hunt.id}
                hunt={hunt}
                entranceDelay={index * 24}
                onChanged={loadHunts}
              />
            ))}
          </div>
        )}

        {!loading && !error && visibleHunts.length === 0 && (
          <div className="shape-organic border border-dashed border-outline py-10 text-center">
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
