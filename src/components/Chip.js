import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../theme";

const Chip = ({ label, selected = false, onPress, onLongPress, disabled = false, style }) => (
  <Pressable
    onPress={onPress}
    onLongPress={onLongPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityState={{ selected: !!selected, disabled }}
    style={[styles.chip, selected && styles.selected, disabled && styles.disabled, style]}
  >
    <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { backgroundColor: colors.accentStrong, borderColor: colors.accentStrong },
  disabled: { opacity: 0.5 },
  text: { color: colors.text, fontSize: 14 },
  selectedText: { color: "#fff" },
});

export default Chip;
