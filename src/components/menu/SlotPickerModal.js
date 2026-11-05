import { StyleSheet, View } from "react-native";
import AppModal from "../AppModal";
import Chip from "../Chip";
import { spacing } from "../../theme";
import { SUGGESTED_SLOT_NAMES } from "../../store/menuSlice";
import { PickerGroup, PickerRow } from "./PickerRow";

const SlotPickerModal = ({ visible, week, currentSlotId, currentDay, onSelectSlot, onSelectDay, onAddSlotAndMove, onClose }) => {
  const unplannedCurrent = currentSlotId === null && currentDay == null;
  return (
    <AppModal visible={visible} onClose={onClose} title={"Move to…"}>
      <PickerRow label="Unplanned" icon="time-outline" current={unplannedCurrent} onPress={() => onSelectSlot(null)} />
      {week.map((day) => {
        const used = new Set(day.slots.map((s) => s.name.trim().toLowerCase()));
        const suggestions = SUGGESTED_SLOT_NAMES.filter((n) => !used.has(n.toLowerCase()));
        return (
          <PickerGroup key={day.day} title={day.label}>
            <PickerRow
              label={`${day.label}, any meal`}
              current={currentSlotId === null && currentDay === day.day}
              onPress={() => onSelectDay(day.day)}
            />
            {day.slots.map((slot) => (
              <PickerRow key={slot.id} label={slot.name} current={slot.id === currentSlotId} onPress={() => onSelectSlot(slot.id)} />
            ))}
            {suggestions.length > 0 ? (
              <View style={styles.chips}>
                {suggestions.map((name) => (
                  <Chip
                    key={name}
                    size="sm"
                    icon="add"
                    label={name}
                    accessibilityLabel={`Add ${name} on ${day.label} and move here`}
                    onPress={() => onAddSlotAndMove(day.day, name)}
                  />
                ))}
              </View>
            ) : null}
          </PickerGroup>
        );
      })}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
});

export default SlotPickerModal;
