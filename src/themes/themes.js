// Theme registry for RIP.
//
// Each theme is a flat map of CSS custom properties applied to :root.
// To add a new theme: append an entry here (or load from JSON via the
// custom-themes settings key). Users can also import/export a theme JSON
// with the same shape: { id, name, description, vars: { "--bg": "...", ... } }.
//
// Every theme MUST define the same variable set, otherwise a component that
// reads a missing variable falls back to an inherited value and the app
// renders inconsistently between themes. The set is:
//
//   --bg         app ground (deepest)
//   --bg2        secondary ground (rails, top bars)
//   --panel      raised surface (cards, inputs, menus)
//   --line       hairline borders
//   --line-soft  subtler dividers
//   --ink        primary text
//   --ink-soft   secondary text
//   --muted      tertiary text, disabled
//   --green      send / 2xx / POST
//   --red        delete / 4xx-5xx
//   --blue       GET / latency
//   --violet     PATCH / auth
//   --amber      warning / pending
//   --accent     the one accent (the action colour)
//   --on-accent  text colour that reads ON the accent surface
//
// The original seven theme ids are kept verbatim so a theme saved in an
// existing database still resolves.
export const THEMES = [
  {
    id: "studio",
    name: "Studio",
    description: "Minimal dark. One green accent, colour carries meaning.",
    vars: {
      "--bg": "#0a0b0d", "--bg2": "#0e1014", "--panel": "#131519",
      "--line": "#1e2128", "--line-soft": "#1a1d23",
      "--ink": "#f0f2f5", "--ink-soft": "#b7bdc8", "--muted": "#79818f",
      "--green": "#5ce08a", "--red": "#ff6f7d",
      "--blue": "#64b0ff", "--violet": "#b98cff", "--amber": "#ffc861",
      "--accent": "#5ce08a", "--on-accent": "#04150b", "--on-green": "#04150b", "--on-red": "#04150b",
    },
  },
  {
    id: "terminal-soft",
    name: "Terminal Soft",
    description: "Phosphor green on near-black. Monospace-first, calm.",
    vars: {
      "--bg": "#0c0f0c", "--bg2": "#131713", "--panel": "#181c18",
      "--line": "#243024", "--line-soft": "#1c241e",
      "--ink": "#d6e8d6", "--ink-soft": "#a8c4a8", "--muted": "#718f71",
      "--green": "#4ade80", "--red": "#f87171",
      "--blue": "#7dd3fc", "--violet": "#a78bfa", "--amber": "#fcd34d",
      "--accent": "#4ade80", "--on-accent": "#04150b", "--on-green": "#04150b", "--on-red": "#04150b",
    },
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    description: "Slate on near-black, green accent, airy.",
    vars: {
      "--bg": "#0f1115", "--bg2": "#161922", "--panel": "#1a1e27",
      "--line": "#262a33", "--line-soft": "#1e222a",
      "--ink": "#e6e8ec", "--ink-soft": "#b8bcc6", "--muted": "#8a8f9a",
      "--green": "#34d399", "--red": "#f87171",
      "--blue": "#60a5fa", "--violet": "#a78bfa", "--amber": "#fbbf24",
      "--accent": "#34d399", "--on-accent": "#04150b", "--on-green": "#04150b", "--on-red": "#04150b",
    },
  },
  {
    id: "minimal-light",
    name: "Minimal Light",
    description: "Paper white, ink text, muted accents. For bright rooms.",
    vars: {
      "--bg": "#fafaf7", "--bg2": "#f2f2ee", "--panel": "#ffffff",
      "--line": "#e5e5e0", "--line-soft": "#efefe9",
      "--ink": "#1a1a1a", "--ink-soft": "#374151", "--muted": "#5f6675",
      "--green": "#166534", "--red": "#b91c1c",
      "--blue": "#1d4ed8", "--violet": "#7c3aed", "--amber": "#b45309",
      "--accent": "#1a1a1a", "--on-accent": "#ffffff", "--on-green": "#ffffff", "--on-red": "#ffffff",
    },
  },
  {
    id: "linear",
    name: "Linear-ish",
    description: "Ultra-dark, single violet accent, SaaS-clean.",
    vars: {
      "--bg": "#08090a", "--bg2": "#0f1012", "--panel": "#141518",
      "--line": "#1f2024", "--line-soft": "#17181b",
      "--ink": "#f7f8f8", "--ink-soft": "#c8c9cc", "--muted": "#8a8f98",
      "--green": "#34d399", "--red": "#f87171",
      "--blue": "#60a5fa", "--violet": "#7170ff", "--amber": "#fbbf24",
      "--accent": "#7170ff", "--on-accent": "#ffffff", "--on-green": "#04150b", "--on-red": "#04150b",
    },
  },
  {
    id: "dark-brutalist",
    name: "Dark Brutalist",
    description: "Chunky borders, high contrast, raw.",
    vars: {
      "--bg": "#0b0d10", "--bg2": "#14171c", "--panel": "#14171c",
      "--line": "#e8e6e1", "--line-soft": "#3a3d42",
      "--ink": "#e8e6e1", "--ink-soft": "#b8b6b0", "--muted": "#868c96",
      "--green": "#3dd68c", "--red": "#ff5a6b",
      "--blue": "#60a5fa", "--violet": "#a78bfa", "--amber": "#f5a524",
      "--accent": "#3dd68c", "--on-accent": "#04150b", "--on-green": "#04150b", "--on-red": "#04150b",
    },
  },
  {
    id: "neo-brutal",
    name: "Neo-Brutal",
    description: "Playful: offset shadows, violet + green.",
    vars: {
      "--bg": "#1a1625", "--bg2": "#241f33", "--panel": "#241f33",
      "--line": "#f5f3ff", "--line-soft": "#3b3450",
      "--ink": "#f5f3ff", "--ink-soft": "#d4d0e8", "--muted": "#9a92b8",
      "--green": "#22c55e", "--red": "#fb7185",
      "--blue": "#38bdf8", "--violet": "#c084fc", "--amber": "#fbbf24",
      "--accent": "#22c55e", "--on-accent": "#04150b", "--on-green": "#04150b", "--on-red": "#04150b",
    },
  },
  {
    id: "bright-brutalist",
    name: "Bright Brutalist",
    description: "Cream paper, ink, loud borders. High glare.",
    vars: {
      "--bg": "#f4f1ea", "--bg2": "#ffffff", "--panel": "#ffffff",
      "--line": "#0a0a0a", "--line-soft": "#d9d5cb",
      "--ink": "#0a0a0a", "--ink-soft": "#2a2a2a", "--muted": "#5a5a5a",
      "--green": "#166534", "--red": "#b00020",
      "--blue": "#1d4ed8", "--violet": "#6d28d9", "--amber": "#b26a00",
      "--accent": "#1f7a3d", "--on-accent": "#ffffff", "--on-green": "#ffffff", "--on-red": "#ffffff",
    },
  },
];

export const DEFAULT_THEME = "studio";

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME);
}

export function applyThemeVars(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
