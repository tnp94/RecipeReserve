import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { makeStyles, radius, spacing, typography, useTheme } from "../../theme";

// variant: primary (filled) | tonal (soft fill) | secondary (outlined) | ghost (text only)
//          | danger (filled red) | dangerGhost (red text)
// size: md (44pt tall) | sm (36pt, for toolbars and cards)
const Button = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const theme = useTheme();
  const styles = useStyles();
  const v = variantColors(theme, variant);
  const iconSize = size === "sm" ? 16 : 18;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
      style={({ pressed, hovered }) => [
        styles.base,
        size === "sm" ? styles.sm : styles.md,
        { backgroundColor: pressed ? v.pressed : hovered ? v.hover : v.background, borderColor: v.border },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? <Ionicons name={icon} size={iconSize} color={v.foreground} /> : null}
        {label ? (
          <Text style={[size === "sm" ? styles.labelSm : styles.label, { color: v.foreground }]} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
        {iconRight ? <Ionicons name={iconRight} size={iconSize} color={v.foreground} /> : null}
      </View>
    </Pressable>
  );
};

function variantColors(theme, variant) {
  const c = theme.colors;
  switch (variant) {
    case "tonal":
      return { background: c.primarySoft, hover: c.primarySoft, pressed: c.border, border: "transparent", foreground: c.onPrimarySoft };
    case "secondary":
      return { background: c.surface, hover: c.surfaceAlt, pressed: c.surfaceAlt, border: c.borderStrong, foreground: c.text };
    case "ghost":
      return { background: "transparent", hover: c.surfaceAlt, pressed: c.surfaceAlt, border: "transparent", foreground: c.primary };
    case "danger":
      return { background: c.danger, hover: c.dangerPressed, pressed: c.dangerPressed, border: "transparent", foreground: c.onDanger };
    case "dangerGhost":
      return { background: "transparent", hover: c.dangerSoft, pressed: c.dangerSoft, border: "transparent", foreground: c.danger };
    case "primary":
    default:
      return { background: c.primary, hover: c.primaryPressed, pressed: c.primaryPressed, border: "transparent", foreground: c.onPrimary };
  }
}

const useStyles = makeStyles(() => ({
  base: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer", userSelect: "none" } : null),
  },
  md: { minHeight: 44, paddingHorizontal: spacing.lg + 2 },
  sm: { minHeight: 36, paddingHorizontal: spacing.md + 2 },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.45 },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { ...typography.bodyStrong },
  labelSm: { ...typography.smallStrong },
}));

export default Button;
