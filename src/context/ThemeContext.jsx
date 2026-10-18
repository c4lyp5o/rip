import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getTheme, applyThemeVars, DEFAULT_THEME, THEMES } from "../themes/themes";
import { getSetting, setSetting } from "../utils/ripDb";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(DEFAULT_THEME);
  const [customThemes, setCustomThemes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved theme + custom themes from DB on mount.
  useEffect(() => {
    (async () => {
      try {
        const saved = await getSetting("theme");
        if (saved) setThemeId(saved);
        const savedCustom = await getSetting("customThemes");
        if (savedCustom) {
          try { setCustomThemes(JSON.parse(savedCustom)); } catch { /* ignore */ }
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const allThemes = [...THEMES, ...customThemes];

  // Apply vars whenever theme changes.
  useEffect(() => {
    const theme = getTheme(themeId) || allThemes.find((t) => t.id === themeId);
    if (theme) applyThemeVars(theme.vars);
  }, [themeId, allThemes]);

  const setTheme = useCallback(async (id) => {
    setThemeId(id);
    try { await setSetting("theme", id); } catch { /* ignore */ }
  }, []);

  const saveCustomTheme = useCallback(async (theme) => {
    const next = [...customThemes.filter((t) => t.id !== theme.id), theme];
    setCustomThemes(next);
    try { await setSetting("customThemes", JSON.stringify(next)); } catch { /* ignore */ }
    setThemeId(theme.id);
  }, [customThemes, setThemeId]);

  const removeCustomTheme = useCallback(async (id) => {
    const next = customThemes.filter((t) => t.id !== id);
    setCustomThemes(next);
    try { await setSetting("customThemes", JSON.stringify(next)); } catch { /* ignore */ }
    if (themeId === id) setThemeId(DEFAULT_THEME);
  }, [customThemes, themeId]);

  const exportTheme = useCallback((id) => {
    const theme = allThemes.find((t) => t.id === id);
    if (!theme) return null;
    return JSON.stringify(theme, null, 2);
  }, [allThemes]);

  const importTheme = useCallback(async (json) => {
    const parsed = JSON.parse(json);
    if (!parsed.id || !parsed.name || !parsed.vars) throw new Error("Invalid theme JSON");
    await saveCustomTheme(parsed);
  }, [saveCustomTheme]);

  return (
    <ThemeContext.Provider
      value={{
        themeId, setTheme, themes: allThemes, customThemes,
        saveCustomTheme, removeCustomTheme, exportTheme, importTheme, loaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
