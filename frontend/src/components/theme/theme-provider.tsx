import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type EffectiveTheme = "dark" | "light";
type Theme = EffectiveTheme | "system";
type BaseTheme = "neutral" | "stone" | "zinc" | "gray";
type AccentColor =
  | "none"
  | "red"
  | "rose"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultBaseTheme?: BaseTheme;
  defaultAccentColor?: AccentColor;
  storageKey?: string;
  baseThemeStorageKey?: string;
  accentColorStorageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  baseTheme: BaseTheme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setBaseTheme: (baseTheme: BaseTheme) => void;
  setAccentColor: (accentColor: AccentColor) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  effectiveTheme: "dark",
  baseTheme: "zinc",
  accentColor: "none",
  setTheme: () => null,
  setBaseTheme: () => null,
  setAccentColor: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function getSystemTheme(): EffectiveTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultBaseTheme = "zinc",
  defaultAccentColor = "none",
  storageKey = "bruh-ui-theme",
  baseThemeStorageKey = "bruh-ui-base-theme",
  accentColorStorageKey = "bruh-ui-accent-color",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [baseTheme, setBaseThemeState] = useState<BaseTheme>(() => {
    return (
      (localStorage.getItem(baseThemeStorageKey) as BaseTheme) ||
      defaultBaseTheme
    );
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (
      (localStorage.getItem(accentColorStorageKey) as AccentColor) ||
      defaultAccentColor
    );
  });

  // Only needed if you want live updates when theme === "system"
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(() =>
    getSystemTheme(),
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemTheme(mql.matches ? "dark" : "light");

    // modern + fallback
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, []);

  const effectiveTheme: EffectiveTheme = useMemo(() => {
    return theme === "system" ? systemTheme : theme;
  }, [theme, systemTheme]);

  // Sync theme classes to DOM (external side effect)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("neutral", "stone", "zinc", "gray");
    root.classList.add(baseTheme);
  }, [baseTheme]);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove(
      "red",
      "rose",
      "orange",
      "amber",
      "yellow",
      "lime",
      "green",
      "emerald",
      "teal",
      "cyan",
      "sky",
      "blue",
      "indigo",
      "violet",
      "purple",
      "fuchsia",
      "pink",
    );

    if (accentColor !== "none") root.classList.add(accentColor);
  }, [accentColor]);

  const value: ThemeProviderState = {
    theme,
    effectiveTheme,
    baseTheme,
    accentColor,
    setTheme: (next) => {
      localStorage.setItem(storageKey, next);
      setThemeState(next);
    },
    setBaseTheme: (next) => {
      localStorage.setItem(baseThemeStorageKey, next);
      setBaseThemeState(next);
    },
    setAccentColor: (next) => {
      localStorage.setItem(accentColorStorageKey, next);
      setAccentColorState(next);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
