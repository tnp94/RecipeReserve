import { Platform, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../ui";
import { makeStyles, radius, spacing, useTheme } from "../../theme";

// A tappable choice in a picker sheet. `current` marks (and disables) where the item is now.
export const PickerRow = ({ label, onPress, current = false, icon, danger = false }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      style={({ pressed, hovered }) => [styles.row, (pressed || hovered) && !current && styles.pressed]}
      disabled={current}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: current, selected: current }}
      accessibilityLabel={current ? `${label} (current)` : label}
    >
      {icon ? <Ionicons name={icon} size={20} color={danger ? theme.colors.danger : theme.colors.primary} /> : null}
      <AppText variant="body" style={[styles.text, danger && { color: theme.colors.danger }, current && { color: theme.colors.textSubtle }]}>
        {label}
      </AppText>
      {current ? <AppText variant="caption" tone="subtle">Current</AppText> : null}
    </Pressable>
  );
};

export const PickerGroup = ({ title, children }) => {
  const styles = useStyles();
  return (
    <View style={styles.group}>
      <AppText variant="overline" tone="muted" style={styles.groupTitle}>{title}</AppText>
      {children}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  pressed: { backgroundColor: t.colors.surfaceAlt },
  text: { flex: 1 },
  group: { marginTop: spacing.md },
  groupTitle: { paddingHorizontal: spacing.sm, marginBottom: spacing.xs },
}));
