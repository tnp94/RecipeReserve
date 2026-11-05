import { createContext, useContext, useMemo } from "react";
import { StyleSheet } from "react-native";
import { DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from "@react-navigation/native";
import freshWarm from "./themes/freshWarm";
import { DEFAULT_THEME_NAME } from "./themes/defaultName";
import { spacing, radius, typography, elevation, HIT } from "./tokens";

export { spacing, radius, typography, elevation, HIT };

// ---------------------------------------------------------------------------------------
// Theme registry. To add a theme: create ./themes/<name>.js with the same `colors` keys as
// freshWarm, add it here, and (optionally) offer it in Settings via setThemeName.
// ---------------------------------------------------------------------------------------
export const THEMES = { [freshWarm.name]: freshWarm };
export { DEFAULT_THEME_NAME };

export const getTheme = (name) => THEMES[name] ?? THEMES[DEFAULT_THEME_NAME];

const ThemeContext = createContext(getTheme(DEFAULT_THEME_NAME));

export function ThemeProvider({ name, children }) {
  const theme = getTheme(name);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// Builds a style hook from a function of the theme. Styles are created once per theme and
// shared by every component instance:
//   const useStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.surface } }));
//   const styles = useStyles();
export function makeStyles(factory) {
  const cache = new WeakMap();
  return function useStyles() {
    const theme = useTheme();
    let styles = cache.get(theme);
    if (!styles) {
      styles = StyleSheet.create(factory(theme));
      cache.set(theme, styles);
    }
    return styles;
  };
}

// React Navigation theme derived from the app theme (headers, tab bar, card background).
export function useNavigationTheme() {
  const theme = useTheme();
  return useMemo(() => {
    const base = theme.dark ? NavDarkTheme : NavDefaultTheme;
    const c = theme.colors;
    return {
      ...base,
      dark: theme.dark,
      colors: {
        ...base.colors,
        primary: c.primary,
        background: c.background,
        card: c.surface,
        text: c.text,
        border: c.border,
        notification: c.accent,
      },
    };
  }, [theme]);
}
