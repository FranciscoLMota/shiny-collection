
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { GraphicMark } from "./components/GraphicMark";
import ThemeTerminal from "./components/ThemeTerminal";
import NationalDexPage from "./pages/NationalDexPage";
import HuntBoardPage from "./pages/HuntBoardPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <nav
        aria-label="Primary navigation"
        className="site-navigation sticky top-0 z-40 border-b border-outline bg-canvas"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center border border-accent/40 bg-surface text-accent">
              <GraphicMark variant="solar" size={18} />
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span className="font-display text-sm font-bold uppercase tracking-[0.16em] text-ink">
                S.P.O.N.
              </span>
              <span className="sr-only font-mono text-[9px] uppercase tracking-[0.12em] text-muted sm:not-sr-only">
                Shiny Phenotype Observation Network
              </span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1 border border-outline bg-surface p-1">
            <NavLink
              to="/dex"
              viewTransition
              className={({ isActive }) =>
                `flex min-h-9 items-center gap-2 border px-2.5 text-xs font-medium transition-colors duration-150 ease-instrument motion-reduce:transition-none ${
                  isActive
                    ? "border-accent/50 bg-canvas text-ink"
                    : "border-transparent text-muted hover:border-outline hover:bg-canvas hover:text-ink"
                }`
              }
            >
              <span aria-hidden="true" className="font-mono text-[9px] text-accent">
                01
              </span>
              Pokédex
            </NavLink>

            <NavLink
              to="/hunts"
              viewTransition
              className={({ isActive }) =>
                `flex min-h-9 items-center gap-2 border px-2.5 text-xs font-medium transition-colors duration-150 ease-instrument motion-reduce:transition-none ${
                  isActive
                    ? "border-accent/50 bg-canvas text-ink"
                    : "border-transparent text-muted hover:border-outline hover:bg-canvas hover:text-ink"
                }`
              }
            >
              <span aria-hidden="true" className="font-mono text-[9px] text-accent">
                02
              </span>
              Hunt Board
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="route-transition-content flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/dex" replace />} />
          <Route path="/dex" element={<NationalDexPage />} />
          <Route path="/hunts" element={<HuntBoardPage />} />
          <Route path="*" element={<Navigate to="/dex" replace />} />
        </Routes>
      </div>
      <footer className="mx-auto mt-auto flex w-full max-w-7xl items-center justify-between border-t border-outline px-4 py-3 text-muted sm:px-8 lg:px-12">
        <GraphicMark variant="identifier" size={26} />
        <GraphicMark variant="signal" size={26} />
      </footer>
      <ThemeTerminal />
    </div>
  );
}
