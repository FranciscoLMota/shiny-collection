
import { useState } from "react";
import NationalDexPage from "./pages/NationalDexPage";
import HuntBoardPage from "./pages/HuntBoardPage";

type Page = "dex" | "hunts";

export default function App() {
  const [page, setPage] = useState<Page>("dex");

  return (
    <div className="min-h-screen bg-obsidian">
      <nav className="sticky top-0 z-40 border-b border-border bg-obsidian/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 lg:px-12">
          <span className="font-display text-lg font-bold tracking-tight text-gold">
            ✦ Shiny Archive
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setPage("dex")}
              className={`rounded-lg px-4 py-2 text-sm ${
                page === "dex"
                  ? "bg-gold text-obsidian"
                  : "text-muted hover:bg-surface hover:text-white"
              }`}
            >
              Pokédex
            </button>

            <button
              onClick={() => setPage("hunts")}
              className={`rounded-lg px-4 py-2 text-sm ${
                page === "hunts"
                  ? "bg-gold text-obsidian"
                  : "text-muted hover:bg-surface hover:text-white"
              }`}
            >
              Hunt Board
            </button>
          </div>
        </div>
      </nav>

      {page === "dex" ? (
        <NationalDexPage />
      ) : (
        <HuntBoardPage />
      )}
    </div>
  );
}
