import { useState } from "react";
import { View } from "react-native";
import { useDispatch } from "react-redux";
import { elevation, makeStyles, radius, spacing } from "../../theme";
import { SUGGESTED_SLOT_NAMES, moveMenuEntryToDay, moveSlot, swapDays } from "../../store/menuSlice";
import { menuDropAction } from "../../domain/menuDrag";
import { useDropOverStyle } from "./drag/DragProvider";
import DragHandle from "./drag/DragHandle";
import useDropZone from "./drag/useDropZone";
import Chip from "../Chip";
import { AppText, Badge, IconButton } from "../ui";
import MenuSlot from "./MenuSlot";
import MenuEntryRow from "./MenuEntryRow";

const MenuDay = ({ day, isToday, onDayMenu, onAddSlot, onCustomSlot, onSlotRename, onSlotMenu, onEntryPress, onEntryRemove }) => {
  const styles = useStyles();
  const dropOverStyle = useDropOverStyle();
  const [adding, setAdding] = useState(false);
  const used = new Set(day.slots.map((s) => s.name.trim().toLowerCase()));
  const suggestions = SUGGESTED_SLOT_NAMES.filter((n) => !used.has(n.toLowerCase()));
  const dispatch = useDispatch();
  const { ref: cardRef, isOver: slotOver } = useDropZone({
    key: `day:${day.day}`,
    accepts: ["slot", "entry"],
    actionFor: (p) => menuDropAction({ kind: "day", entries: day.entries, slots: day.slots }, p),
    onDrop: (p) => {
      if (p.type === "entry") dispatch(moveMenuEntryToDay({ entryId: p.id, day: day.day }));
      else dispatch(moveSlot({ slotId: p.id, day: day.day }));
    },
  });
  const { ref: headerRef, isOver: dayOver } = useDropZone({
    key: `dayheader:${day.day}`,
    accepts: ["day"],
    actionFor: (p) => menuDropAction({ kind: "dayHeader", id: day.day }, p),
    onDrop: (p) => dispatch(swapDays({ dayA: p.id, dayB: day.day })),
  });
  const count = day.entries.length + day.slots.reduce((n, s) => n + s.entries.length, 0);
  const empty = count === 0 && day.slots.length === 0;
  return (
    <View ref={cardRef} collapsable={false} style={[styles.card, isToday && styles.today, dropOverStyle(slotOver)]}>
      <View ref={headerRef} collapsable={false} style={[styles.header, dropOverStyle(dayOver)]}>
        <DragHandle payload={{ type: "day", id: day.day }} label={day.label} />
        <View style={styles.titleRow}>
          <AppText variant="subheading" accessibilityRole="header">{day.label}</AppText>
          {isToday ? <Badge label="Today" tone="solid" /> : null}
          {count > 0 ? <AppText variant="small" tone="muted">{`${count} planned`}</AppText> : null}
        </View>
        <IconButton icon="ellipsis-horizontal" size={20} onPress={() => onDayMenu(day)} accessibilityLabel={`${day.label} options`} />
      </View>
      <View style={styles.body}>
        {empty ? <AppText variant="small" tone="subtle" style={styles.emptyText}>Nothing planned yet.</AppText> : null}
        {day.entries.map((entry) => (
          <MenuEntryRow key={entry.id} entry={entry} onPress={() => onEntryPress(entry)} onRemove={() => onEntryRemove(entry)} />
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
      </View>
      <View style={styles.chips}>
        {adding ? (
          <>
            {suggestions.map((name) => (
              <Chip
                key={name}
                size="sm"
                icon="add"
                label={name}
                accessibilityLabel={`Add ${name} to ${day.label}`}
                onPress={() => onAddSlot(day.day, name)}
              />
            ))}
            <Chip size="sm" icon="create-outline" label={"Custom…"} onPress={() => onCustomSlot(day.day)} accessibilityLabel={`Add a custom meal to ${day.label}`} />
            <Chip size="sm" label="Done" onPress={() => setAdding(false)} />
          </>
        ) : (
          <Chip size="sm" icon="add" label="Add meal" onPress={() => setAdding(true)} accessibilityLabel={`Add a meal slot to ${day.label}`} />
        )}
      </View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: t.colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...elevation(t, 1),
  },
  today: { borderColor: t.colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderWidth: 2,
    borderColor: "transparent",
    paddingRight: spacing.xs,
  },
  titleRow: { flex: 1, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  body: { paddingHorizontal: spacing.xs },
  emptyText: { paddingLeft: 40, paddingBottom: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.md },
}));

export default MenuDay;
