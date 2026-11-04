import { Pressable, StyleSheet, Text, View } from "react-native";
import AppModal from "../AppModal";
import Chip from "../Chip";
import { colors, spacing } from "../../theme";
import { SUGGESTED_SLOT_NAMES } from "../../store/menuSlice";

const SlotPickerModal = ({ visible, week, currentSlotId, onSelectSlot, onAddSlotAndMove, onClose }) => (
  <AppModal visible={visible} onClose={onClose} title={"Move to…"}>
    <Pressable
      style={[styles.row, currentSlotId === null && styles.disabled]}
      disabled={currentSlotId === null}
      onPress={() => onSelectSlot(null)}
      accessibilityRole="button"
    >
      <Text style={styles.text}>{currentSlotId === null ? "Unplanned (current)" : "Unplanned"}</Text>
    </Pressable>
    {week.map((day) => {
      const used = new Set(day.slots.map((s) => s.name.trim().toLowerCase()));
      return (
        <View key={day.day}>
          <Text style={styles.group}>{day.label}</Text>
          {day.slots.map((slot) => {
            const current = slot.id === currentSlotId;
            return (
              <Pressable
                key={slot.id}
                style={[styles.row, current && styles.disabled]}
                disabled={current}
                onPress={() => onSelectSlot(slot.id)}
                accessibilityRole="button"
              >
                <Text style={styles.text}>{current ? `${slot.name} (current)` : slot.name}</Text>
              </Pressable>
            );
          })}
          <View style={styles.chips}>
            {SUGGESTED_SLOT_NAMES.filter((n) => !used.has(n.toLowerCase())).map((name) => (
              <Chip key={name} label={`+ ${name}`} onPress={() => onAddSlotAndMove(day.day, name)} />
            ))}
          </View>
        </View>
      );
    })}
  </AppModal>
);

const styles = StyleSheet.create({
  group: { fontSize: 13, fontWeight: "bold", color: colors.muted, textTransform: "uppercase", marginTop: spacing.md },
  row: { minHeight: 44, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.sm },
  disabled: { opacity: 0.45 },
  text: { fontSize: 16, color: colors.text },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingVertical: spacing.sm },
});

export default SlotPickerModal;
