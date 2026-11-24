
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { GraphicMark } from "./components/GraphicMark";
import ThemeTerminal from "./components/ThemeTerminal";
import NationalDexPage from "./pages/NationalDexPage";
import HuntBoardPage from "./pages/HuntBoardPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <nav className="site-navigation sticky top-0 z-40 border-b border-outline bg-canvas">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8 lg:px-12">
          <span className="flex items-center gap-1.5 font-display text-base font-bold uppercase tracking-[0.04em] text-ink">
            <GraphicMark variant="solar" size={22} />
            Shiny Phenotype Observation Network
          </span>

          <div className="flex gap-2">
            <NavLink
              to="/dex"
              viewTransition
              className={({ isActive }) =>
                `btn border-transparent ${
                  isActive
                    ? "bg-accent text-accent-ink"
                    : "text-ink hover:bg-surface"
                }`
              }
            >
              Pokédex
            </NavLink>

            <NavLink
              to="/hunts"
              viewTransition
              className={({ isActive }) =>
                `btn border-transparent ${
                  isActive
                    ? "bg-accent text-accent-ink"
                    : "text-ink hover:bg-surface"
                }`
              }
            >
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
