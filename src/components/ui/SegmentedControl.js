import { Platform, Pressable, View } from "react-native";
import { makeStyles, radius, spacing, useTheme } from "../../theme";
import AppText from "./AppText";

// One-of-N picker. options: [{ value, label }]. With `allowDeselect`, tapping the
// selected option clears the value (onChange(null)).
const SegmentedControl = ({ options, value, onChange, allowDeselect = false, accessibilityLabel, style }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.track, style]} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(selected && allowDeselect ? null : o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={o.label}
            style={[styles.segment, selected && styles.selected]}
          >
            <AppText variant="smallStrong" style={{ color: selected ? theme.colors.onPrimary : theme.colors.textMuted }} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  track: {
    flexDirection: "row",
    backgroundColor: t.colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  selected: { backgroundColor: t.colors.primary },
}));

export default SegmentedControl;
