// Theme-independent design tokens: spacing, corner radii and type scale. Colours live in
// the themes (./themes), so swapping a theme never changes layout.
export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

// System fonts throughout; weights and sizes give the hierarchy.
export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.3 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700", letterSpacing: -0.2 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "700" },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  small: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  smallStrong: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
};

// Minimum touch target (Apple HIG / Material).
export const HIT = 44;

// Soft elevation for cards and sheets; colour comes from the theme.
export const elevation = (theme, level = 1) => {
  if (level <= 0) return {};
  return {
    shadowColor: theme.colors.shadow,
    shadowOpacity: level === 1 ? 0.06 : 0.14,
    shadowRadius: level === 1 ? 6 : 16,
    shadowOffset: { width: 0, height: level === 1 ? 2 : 6 },
    elevation: level === 1 ? 2 : 8,
  };
};
