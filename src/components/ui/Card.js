import { Platform, Pressable, View } from "react-native";
import { elevation, makeStyles, radius, spacing } from "../../theme";

// Surface container. Pass `onPress` to make the whole card tappable.
// padded: true (16) | "none" | a number
const Card = ({ children, onPress, onLongPress, style, padded = true, accessibilityLabel, accessibilityHint }) => {
  const styles = useStyles();
  const padding = padded === true ? spacing.lg : padded === "none" || padded === false ? 0 : padded;
  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed, hovered }) => [
          styles.card,
          { padding },
          hovered && styles.hovered,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
};

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    ...elevation(t, 1),
    ...(Platform.OS === "web" ? { cursor: "default" } : null),
  },
  hovered: { borderColor: t.colors.borderStrong, ...(Platform.OS === "web" ? { cursor: "pointer" } : null) },
  pressed: { opacity: 0.92 },
}));

export default Card;
