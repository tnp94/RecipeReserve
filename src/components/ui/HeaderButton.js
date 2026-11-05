import { Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { makeStyles, radius, spacing, typography, useTheme } from "../../theme";

// Button for navigation headers (headerRight). `filled` renders the screen's main action
// as a primary pill ("Save", "Generate list"); otherwise it's a text/icon button.
const HeaderButton = ({ label, icon, onPress, filled = false, accessibilityLabel, disabled = false }) => {
  const theme = useTheme();
  const styles = useStyles();
  const color = filled ? theme.colors.onPrimary : theme.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={({ pressed, hovered }) => [
        styles.base,
        filled && styles.filled,
        filled && (pressed || hovered) && styles.filledPressed,
        !filled && (pressed || hovered) && styles.plainPressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {icon ? <Ionicons name={icon} size={label ? 18 : 24} color={color} /> : null}
        {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
      </View>
    </Pressable>
  );
};

export const HeaderButtons = ({ children }) => {
  const styles = useStyles();
  return <View style={styles.group}>{children}</View>;
};

const useStyles = makeStyles((t) => ({
  base: {
    minHeight: 36,
    minWidth: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  filled: { backgroundColor: t.colors.primary, paddingHorizontal: spacing.md + 2 },
  filledPressed: { backgroundColor: t.colors.primaryPressed },
  plainPressed: { backgroundColor: t.colors.surfaceAlt },
  disabled: { opacity: 0.45 },
  content: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { ...typography.smallStrong, fontSize: 15 },
  group: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginRight: spacing.md },
}));

export default HeaderButton;
