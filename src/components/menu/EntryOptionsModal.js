import { Pressable, StyleSheet, Text, View } from "react-native";
import AppModal from "../AppModal";
import Chip from "../Chip";
import { colors, spacing } from "../../theme";

const PRESETS = [[0.5, "½×"], [1, "1×"], [2, "2×"], [3, "3×"]];

const ActionRow = ({ label, onPress, danger }) => (
  <Pressable style={styles.action} onPress={onPress} accessibilityRole="button">
    <Text style={[styles.actionText, danger && { color: colors.danger }]}>{label}</Text>
  </Pressable>
);

const round1 = (n) => Math.round(n * 10) / 10;

const EntryOptionsModal = ({ visible, entry, onClose, onSetScale, onMove, onSwap, onView, onRemove }) => {
  if (!entry) return null;
  const { recipe, scale } = entry;
  const label = recipe.yield > 0 ? `Serves ${round1(recipe.yield * scale)}` : `Scale ×${scale}`;
  const step = (delta) => onSetScale(Math.min(20, Math.max(0.5, scale + delta)));
  return (
    <AppModal visible={visible} onClose={onClose} title={recipe.name}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.scaleRow}>
        <Chip label={"−"} onPress={() => step(-0.5)} disabled={scale <= 0.5} style={styles.stepper} />
        {PRESETS.map(([value, text]) => (
          <Chip key={value} label={text} selected={scale === value} onPress={() => onSetScale(value)} />
        ))}
        <Chip label="+" onPress={() => step(0.5)} disabled={scale >= 20} style={styles.stepper} />
      </View>
      <ActionRow label={"Move to…"} onPress={onMove} />
      <ActionRow label={"Swap with…"} onPress={onSwap} />
      <ActionRow label="View recipe" onPress={onView} />
      <ActionRow label="Remove from menu" onPress={onRemove} danger />
    </AppModal>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 16, color: colors.text, marginBottom: spacing.sm },
  scaleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  stepper: { minWidth: 40 },
  action: { minHeight: 48, justifyContent: "center", borderTopWidth: 1, borderTopColor: colors.border },
  actionText: { fontSize: 16, color: colors.accentStrong },
});

export default EntryOptionsModal;
