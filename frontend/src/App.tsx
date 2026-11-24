
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { Sparkles } from "lucide-react";
import NationalDexPage from "./pages/NationalDexPage";
import HuntBoardPage from "./pages/HuntBoardPage";

export default function App() {
  return (
    <div className="min-h-screen bg-obsidian">
      <nav className="sticky top-0 z-40 border-b border-border bg-obsidian/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 lg:px-12">
          <span className="flex items-center gap-1.5 font-display text-xl font-semibold tracking-tight text-gold">
            <Sparkles size={18} aria-hidden="true" />
            Shiny Archive
          </span>

          <div className="flex gap-2">
            <NavLink
              to="/dex"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 font-body text-xs font-medium ${
                  isActive
                    ? "bg-gold text-obsidian"
                    : "text-muted hover:bg-surface hover:text-white"
                }`
              }
            >
              Pokédex
            </NavLink>

            <NavLink
              to="/hunts"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 font-body text-xs font-medium ${
                  isActive
                    ? "bg-gold text-obsidian"
                    : "text-muted hover:bg-surface hover:text-white"
                }`
              }
            >
              Hunt Board
            </NavLink>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/dex" replace />} />
        <Route path="/dex" element={<NationalDexPage />} />
        <Route path="/hunts" element={<HuntBoardPage />} />
        <Route path="*" element={<Navigate to="/dex" replace />} />
      </Routes>
    </div>
  );
}
