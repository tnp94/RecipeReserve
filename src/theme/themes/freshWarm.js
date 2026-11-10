// "Fresh & warm": herb green, terracotta and a warm off-white.
//
// A theme is plain data. Every colour the app draws comes from `colors`, under semantic
// names (what it is for, not what it looks like), so a new theme only has to supply the
// same keys. See src/theme/index.js for how themes are registered and selected.
const freshWarm = {
  name: "freshWarm",
  label: "Fresh & warm",
  dark: false, // drives the status bar and React Navigation's base theme
  colors: {
    // Brand
    primary: "#2F6B4F",
    primaryPressed: "#24553E",
    onPrimary: "#FFFFFF",
    primarySoft: "#E3EFE7", // tinted backgrounds: selected chips, today, tonal buttons
    onPrimarySoft: "#1F4D37",
    accent: "#C75B32", // favourites, highlights
    accentSoft: "#F8E6DC",
    onAccentSoft: "#8A3A1C",

    // Surfaces
    background: "#FAF7F2",
    surface: "#FFFFFF",
    surfaceAlt: "#F3EFE8", // inset areas inside a card, input fills
    border: "#E6E0D6",
    borderStrong: "#CFC7BA",

    // Text
    text: "#1F2421",
    textMuted: "#5F655F",
    textSubtle: "#8E928C", // placeholders, disabled
    link: "#2F6B4F",

    // Status
    danger: "#B3261E",
    dangerPressed: "#8F1E18",
    onDanger: "#FFFFFF",
    dangerSoft: "#FBE9E7",
    success: "#2F6B4F",
    warning: "#B7791F",
    warningSoft: "#FDF3E1",
    favorite: "#C75B32",

    // Overlays
    overlay: "rgba(23, 28, 25, 0.45)",
    toast: "#1F2421",
    onToast: "#FFFFFF",
    toastAction: "#9ED3B4",
    shadow: "#2B2118",
    photoViewer: "#0E1110", // behind a full-size photo

    // Drag and drop
    dropTarget: "rgba(47, 107, 79, 0.10)",
    dropTargetBorder: "#2F6B4F",

    // Recipe placeholder tiles (picked per recipe from its name)
    tiles: [
      { background: "#E3EFE7", foreground: "#2F6B4F" },
      { background: "#F8E6DC", foreground: "#A6481F" },
      { background: "#FDF0D5", foreground: "#94650F" },
      { background: "#E6ECF4", foreground: "#3D5A80" },
      { background: "#EFE6F2", foreground: "#6D4A7E" },
      { background: "#E5F1EF", foreground: "#2C6E67" },
    ],
  },
};

export default freshWarm;
