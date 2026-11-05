import { Platform, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HIT, makeStyles, radius, useTheme } from "../../theme";

// Icon-only button with a full 44pt touch target. `accessibilityLabel` is required:
// an icon alone says nothing to a screen reader.
// tone: muted | default | primary | accent | danger | inverse
// variant: plain | filled (primary circle) | tonal (soft circle)
const IconButton = ({
  icon,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  tone = "muted",
  variant = "plain",
  size = 22,
  disabled = false,
  style,
  hitSlop,
}) => {
  const theme = useTheme();
  const styles = useStyles();
  const c = theme.colors;
  const toneColor = {
    muted: c.textMuted,
    default: c.text,
    primary: c.primary,
    accent: c.accent,
    danger: c.danger,
    inverse: c.onPrimary,
  }[tone] ?? tone;
  const color = variant === "filled" ? c.onPrimary : variant === "tonal" ? c.onPrimarySoft : toneColor;
  const background = variant === "filled" ? c.primary : variant === "tonal" ? c.primarySoft : "transparent";
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={({ pressed, hovered }) => [
        styles.base,
        { backgroundColor: background },
        (pressed || hovered) && variant === "plain" && { backgroundColor: c.surfaceAlt },
        pressed && variant !== "plain" && { opacity: 0.8 },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
};

const useStyles = makeStyles(() => ({
  base: {
    width: HIT,
    height: HIT,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  disabled: { opacity: 0.4 },
}));

export default IconButton;
