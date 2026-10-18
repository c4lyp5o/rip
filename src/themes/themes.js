// Theme registry for RIP.
// Each theme is a flat map of CSS custom properties applied to :root.
// To add a new theme: append an entry here (or load from JSON via the
// custom-themes settings key). Users can also import/export a theme JSON
// with the same shape: { id, name, description, vars: { "--bg": "...", ... } }.
export const THEMES = [
  {
    id: "terminal-soft",
    name: "Terminal Soft",
    description: "Phosphor green on near-black. Monospace-first, calm.",
    vars: {
      "--bg": "#0c0f0c", "--bg2": "#131713", "--panel": "#181c18",
      "--ink": "#d6e8d6", "--ink-soft": "#a8c4a8", "--muted": "#6f8a6f",
      "--line": "#243024", "--green": "#4ade80", "--red": "#f87171",
      "--blue": "#7dd3fc", "--violet": "#a78bfa", "--amber": "#fcd34d",
      "--accent": "#4ade80",
    },
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    description: "Slate on near-black, green accent, airy.",
    vars: {
      "--bg": "#0f1115", "--bg2": "#161922", "--panel": "#1a1e27",
      "--ink": "#e6e8ec", "--ink-soft": "#b8bcc6", "--muted": "#8a8f9a",
      "--line": "#262a33", "--green": "#34d399", "--red": "#f87171",
      "--blue": "#60a5fa", "--violet": "#a78bfa", "--amber": "#fbbf24",
      "--accent": "#34d399",
    },
  },
  {
    id: "minimal-light",
    name: "Minimal Light",
    description: "Paper white, ink text, muted accents. For bright rooms.",
    vars: {
      "--bg": "#fafaf7", "--bg2": "#f2f2ee", "--panel": "#ffffff",
      "--ink": "#1a1a1a", "--ink-soft": "#374151", "--muted": "#6b7280",
      "--line": "#e5e5e0", "--green": "#15803d", "--red": "#b91c1c",
      "--blue": "#1d4ed8", "--violet": "#7c3aed", "--amber": "#b45309",
      "--accent": "#1a1a1a",
    },
  },
  {
    id: "linear",
    name: "Linear-ish",
    description: "Ultra-dark, single violet accent, SaaS-clean.",
    vars: {
      "--bg": "#08090a", "--bg2": "#0f1012", "--panel": "#141518",
      "--ink": "#f7f8f8", "--ink-soft": "#c8c9cc", "--muted": "#8a8f98",
      "--line": "#1f2024", "--green": "#34d399", "--red": "#f87171",
      "--blue": "#60a5fa", "--violet": "#7170ff", "--amber": "#fbbf24",
      "--accent": "#7170ff",
    },
  },
  {
    id: "dark-brutalist",
    name: "Dark Brutalist",
    description: "Chunky borders, high contrast, raw.",
    vars: {
      "--bg": "#0b0d10", "--bg2": "#14171c", "--panel": "#14171c",
      "--ink": "#e8e6e1", "--ink-soft": "#b8b6b0", "--muted": "#7a7f88",
      "--line": "#e8e6e1", "--green": "#3dd68c", "--red": "#ff5a6b",
      "--blue": "#60a5fa", "--violet": "#a78bfa", "--amber": "#f5a524",
      "--accent": "#3dd68c",
    },
  },
  {
    id: "neo-brutal",
    name: "Neo-Brutal",
    description: "Playful: offset shadows, violet + green.",
    vars: {
      "--bg": "#1a1625", "--bg2": "#241f33", "--panel": "#241f33",
      "--ink": "#f5f3ff", "--ink-soft": "#d4d0e8", "--muted": "#8b84a8",
      "--line": "#f5f3ff", "--green": "#22c55e", "--red": "#f43f5e",
      "--blue": "#38bdf8", "--violet": "#c084fc", "--amber": "#fbbf24",
      "--accent": "#22c55e",
    },
  },
  {
    id: "bright-brutalist",
    name: "Bright Brutalist",
    description: "Cream paper, ink, loud borders. High glare.",
    vars: {
      "--bg": "#f4f1ea", "--bg2": "#ffffff", "--panel": "#ffffff",
      "--ink": "#0a0a0a", "--ink-soft": "#2a2a2a", "--muted": "#5a5a5a",
      "--line": "#0a0a0a", "--green": "#1f7a3d", "--red": "#b00020",
      "--blue": "#1d4ed8", "--violet": "#6d28d9", "--amber": "#b26a00",
      "--accent": "#1f7a3d",
    },
  },
];

export const DEFAULT_THEME = "terminal-soft";

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME);
}

export function applyThemeVars(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
