import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../theme";
import { SUGGESTED_SLOT_NAMES } from "../../store/menuSlice";
import Chip from "../Chip";
import MenuSlot from "./MenuSlot";

const MenuDay = ({ day, onDayMenu, onAddSlot, onCustomSlot, onSlotRename, onSlotMenu, onEntryPress, onEntryRemove }) => {
  const used = new Set(day.slots.map((s) => s.name.trim().toLowerCase()));
  const suggestions = SUGGESTED_SLOT_NAMES.filter((n) => !used.has(n.toLowerCase()));
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{day.label}</Text>
        <Pressable style={styles.more} onPress={() => onDayMenu(day)} accessibilityRole="button" accessibilityLabel={`${day.label} options`}>
          <Text style={styles.moreText}>{"⋯"}</Text>
        </Pressable>
      </View>
      {day.slots.map((slot) => (
        <MenuSlot
          key={slot.id}
          slot={slot}
          onRename={() => onSlotRename(slot)}
          onMenu={() => onSlotMenu(slot)}
          onEntryPress={onEntryPress}
          onEntryRemove={onEntryRemove}
        />
      ))}
      <View style={styles.chips}>
        {suggestions.map((name) => (
          <Chip key={name} label={`+ ${name}`} onPress={() => onAddSlot(day.day, name)} />
        ))}
        <Chip label={"+ Custom…"} onPress={() => onCustomSlot(day.day)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.md,
    minHeight: 44,
    backgroundColor: colors.accent,
  },
  title: { fontSize: 17, fontWeight: "bold", color: colors.text },
  more: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  moreText: { fontSize: 22, color: colors.text },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, padding: spacing.md },
});

export default MenuDay;
