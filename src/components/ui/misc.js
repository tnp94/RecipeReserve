import { Platform, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { makeStyles, radius, spacing, useTheme } from "../../theme";
import AppText from "./AppText";
import Button from "./Button";

// Small presentational pieces shared across screens.

// Section title with an optional action on the right ("See all", "Clear checked"...).
export const SectionHeader = ({ title, subtitle, actionLabel, onAction, style, variant = "heading" }) => {
  const styles = useStyles();
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.flex}>
        <AppText variant={variant} accessibilityRole="header">{title}</AppText>
        {subtitle ? <AppText variant="small" tone="muted">{subtitle}</AppText> : null}
      </View>
      {actionLabel ? <Button label={actionLabel} onPress={onAction} variant="ghost" size="sm" /> : null}
    </View>
  );
};

// Friendly empty screen: icon, title, message and up to two actions.
export const EmptyState = ({ icon = "sparkles-outline", title, message, actionLabel, onAction, secondaryLabel, onSecondary, style }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={theme.colors.primary} />
      </View>
      {title ? <AppText variant="heading" align="center">{title}</AppText> : null}
      {message ? (
        <AppText variant="body" tone="muted" align="center" style={styles.emptyMessage}>
          {message}
        </AppText>
      ) : null}
      <View style={styles.emptyActions}>
        {actionLabel ? <Button label={actionLabel} onPress={onAction} /> : null}
        {secondaryLabel ? <Button label={secondaryLabel} onPress={onSecondary} variant="secondary" /> : null}
      </View>
    </View>
  );
};

export const ProgressBar = ({ value, style, accessibilityLabel }) => {
  const styles = useStyles();
  const pct = Math.max(0, Math.min(1, Number(value) || 0));
  return (
    <View
      style={[styles.track, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
};

// Small pill label. tone: primary | accent | neutral | warning
export const Badge = ({ label, tone = "primary", icon, style }) => {
  const theme = useTheme();
  const styles = useStyles();
  const c = theme.colors;
  const palette = {
    primary: [c.primarySoft, c.onPrimarySoft],
    accent: [c.accentSoft, c.onAccentSoft],
    neutral: [c.surfaceAlt, c.textMuted],
    warning: [c.warningSoft, c.warning],
    solid: [c.primary, c.onPrimary],
  }[tone] ?? [c.surfaceAlt, c.textMuted];
  return (
    <View style={[styles.badge, { backgroundColor: palette[0] }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={palette[1]} /> : null}
      <AppText variant="caption" style={[styles.badgeText, { color: palette[1] }]} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
};

// Settings-style row: icon, title / subtitle, and a chevron or custom right element.
export const ListRow = ({ icon, title, subtitle, onPress, right, destructive, chevron = !!onPress, accessibilityLabel }) => {
  const theme = useTheme();
  const styles = useStyles();
  const color = destructive ? theme.colors.danger : theme.colors.text;
  const body = (
    <>
      {icon ? (
        <View style={[styles.rowIcon, destructive && { backgroundColor: theme.colors.dangerSoft }]}>
          <Ionicons name={icon} size={18} color={destructive ? theme.colors.danger : theme.colors.primary} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="body" style={{ color }}>{title}</AppText>
        {subtitle ? <AppText variant="small" tone="muted">{subtitle}</AppText> : null}
      </View>
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textSubtle} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed, hovered }) => [styles.row, (pressed || hovered) && { backgroundColor: theme.colors.surfaceAlt }]}
    >
      {body}
    </Pressable>
  );
};

export const Divider = ({ inset = 0, style }) => {
  const styles = useStyles();
  return <View style={[styles.divider, { marginLeft: inset }, style]} />;
};

const useStyles = makeStyles((t) => ({
  flex: { flex: 1, minWidth: 0 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  empty: { alignItems: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: t.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyMessage: { maxWidth: 360 },
  emptyActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.sm, marginTop: spacing.md },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: t.colors.surfaceAlt, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: t.colors.primary },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: t.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: t.colors.border },
}));
