export const themes = [
  { id: "solar-bloom", label: "Solar Bloom", scheme: "light" },
  { id: "tomorrowland", label: "Tomorrowland", scheme: "light" },
  { id: "lunar", label: "Lunar Garden", scheme: "dark" },
  { id: "phosphor-amber", label: "Phosphor Amber", scheme: "dark" },
  { id: "orbital-relay", label: "Orbital Relay", scheme: "light" },
  { id: "rain-garden", label: "Rain Garden", scheme: "light" },
  { id: "rose-canopy", label: "Rose Canopy", scheme: "light" },
  { id: "indigo-observatory", label: "Indigo Observatory", scheme: "dark" },
] as const;

type Theme = (typeof themes)[number]["id"];
const storageKey = "shiny-archive-theme";
const defaultTheme: Theme = "indigo-observatory";
let requestedTheme: Theme | undefined;

export function readTheme(): Theme {
  try {
    const savedTheme = localStorage.getItem(storageKey);
    return themes.find(({ id }) => id === savedTheme)?.id ?? defaultTheme;
  } catch {
    return defaultTheme;
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function saveTheme(theme: Theme) {
  requestedTheme = theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // The active theme still applies when browser storage is unavailable.
  }

  if (document.documentElement.dataset.theme === theme) return;

  if (
    document.startViewTransition &&
    CSS.supports("selector(:active-view-transition-type(theme-change))") &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    document.startViewTransition({
      types: ["theme-change"],
      update: () => {
        if (requestedTheme === theme) applyTheme(theme);
      },
    });
    return;
  }

  applyTheme(theme);
}
