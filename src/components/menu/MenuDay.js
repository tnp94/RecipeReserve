import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../theme";
import { useDispatch } from "react-redux";
import { SUGGESTED_SLOT_NAMES, moveMenuEntryToDay, moveSlot, swapDays } from "../../store/menuSlice";
import { dropOverStyle } from "./drag/DragProvider";
import DragHandle from "./drag/DragHandle";
import useDropZone from "./drag/useDropZone";
import Chip from "../Chip";
import MenuSlot from "./MenuSlot";
import MenuEntryRow from "./MenuEntryRow";

const MenuDay = ({ day, onDayMenu, onAddSlot, onCustomSlot, onSlotRename, onSlotMenu, onEntryPress, onEntryRemove }) => {
  const used = new Set(day.slots.map((s) => s.name.trim().toLowerCase()));
  const suggestions = SUGGESTED_SLOT_NAMES.filter((n) => !used.has(n.toLowerCase()));
  const dispatch = useDispatch();
  const { ref: cardRef, isOver: slotOver } = useDropZone({
    key: `day:${day.day}`,
    accepts: ["slot", "entry"],
    onDrop: (p) => {
      if (p.type === "entry") {
        // moveMenuEntryToDay is a no-op for an entry already day-level on this day.
        dispatch(moveMenuEntryToDay({ entryId: p.id, day: day.day }));
      } else if (!day.slots.some((s) => s.id === p.id)) {
        dispatch(moveSlot({ slotId: p.id, day: day.day }));
      }
    },
  });
  const { ref: headerRef, isOver: dayOver } = useDropZone({
    key: `dayheader:${day.day}`,
    accepts: ["day"],
    onDrop: (p) => {
      if (p.id !== day.day) dispatch(swapDays({ dayA: p.id, dayB: day.day }));
    },
  });
  return (
    <View ref={cardRef} collapsable={false} style={[styles.card, dropOverStyle(slotOver)]}>
      <View ref={headerRef} collapsable={false} style={[styles.header, dropOverStyle(dayOver)]}>
        <DragHandle payload={{ type: "day", id: day.day }} label={day.label} />
        <Text style={styles.title}>{day.label}</Text>
        <Pressable style={styles.more} onPress={() => onDayMenu(day)} accessibilityRole="button" accessibilityLabel={`${day.label} options`}>
          <Text style={styles.moreText}>{"⋯"}</Text>
        </Pressable>
      </View>
      {day.entries.map((entry) => (
        <MenuEntryRow
          key={entry.id}
          entry={entry}
          onPress={() => onEntryPress(entry)}
          onRemove={() => onEntryRemove(entry)}
        />
      ))}
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
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.accent,
  },
  title: { flex: 1, fontSize: 17, fontWeight: "bold", color: colors.text },
  more: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  moreText: { fontSize: 22, color: colors.text },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, padding: spacing.md },
});

export default MenuDay;
