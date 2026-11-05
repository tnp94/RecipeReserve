import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { makeStyles, radius, spacing, typography, useTheme } from "../theme";

// Compact toggle / action pill. `selected` fills it with the primary colour.
const Chip = ({ label, selected = false, onPress, onLongPress, disabled = false, icon, style, accessibilityLabel, size = "md" }) => {
  const theme = useTheme();
  const styles = useStyles();
  const fg = selected ? theme.colors.onPrimary : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected, disabled }}
      style={({ pressed, hovered }) => [
        styles.chip,
        size === "sm" && styles.sm,
        !selected && (pressed || hovered) && styles.hover,
        selected && styles.selected,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={size === "sm" ? 14 : 16} color={selected ? fg : theme.colors.textMuted} /> : null}
      <Text style={[styles.text, size === "sm" && styles.textSm, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

const useStyles = makeStyles((t) => ({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    ...(Platform.OS === "web" ? { cursor: "pointer", userSelect: "none" } : null),
  },
  sm: { minHeight: 30, paddingHorizontal: spacing.sm + 2 },
  hover: { backgroundColor: t.colors.surfaceAlt },
  selected: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  disabled: { opacity: 0.45 },
  text: { ...typography.smallStrong, fontWeight: "500" },
  textSm: { fontSize: 13 },
}));

export default Chip;
