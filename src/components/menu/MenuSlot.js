import { Platform, Pressable, View } from "react-native";
import { makeStyles, radius, spacing } from "../../theme";
import { useDispatch } from "react-redux";
import { moveMenuEntry, reorderSlot } from "../../store/menuSlice";
import MenuEntryRow from "./MenuEntryRow";
import { useDropOverStyle } from "./drag/DragProvider";
import DragHandle from "./drag/DragHandle";
import useDropZone from "./drag/useDropZone";
import { AppText, IconButton } from "../ui";

const MenuSlot = ({ slot, onRename, onMenu, onEntryPress, onEntryRemove }) => {
  const dispatch = useDispatch();
  const styles = useStyles();
  const dropOverStyle = useDropOverStyle();
  const { ref, isOver, hoverHalf, activeType, activeId } = useDropZone({
    key: `slot:${slot.id}`,
    accepts: ["entry", "slot"],
    onDrop: (p, info) => {
      if (p.type === "slot") {
        if (p.id === slot.id) return;
        // Same before/after the insertion line showed (computed once, in DragProvider).
        const position = info?.half === "after" ? "after" : "before";
        dispatch(reorderSlot({ slotId: p.id, targetSlotId: slot.id, position }));
      } else if (!slot.entries.some((e) => e.id === p.id)) {
        dispatch(moveMenuEntry({ entryId: p.id, slotId: slot.id }));
      }
    },
  });
  const slotHover = isOver && activeType === "slot";
  const showLine = slotHover && activeId !== slot.id;
  return (
    <View ref={ref} collapsable={false} style={[styles.slot, dropOverStyle(isOver && !slotHover)]}>
      {showLine ? (
        <View pointerEvents="none" style={[styles.line, hoverHalf === "after" ? styles.lineBottom : styles.lineTop]} />
      ) : null}
      <View style={styles.header}>
        <DragHandle payload={{ type: "slot", id: slot.id }} label={slot.name} />
        <Pressable style={styles.nameButton} onPress={onRename} accessibilityRole="button" accessibilityLabel={`Rename ${slot.name}`}>
          <AppText variant="overline" tone="muted" numberOfLines={1}>{slot.name}</AppText>
        </Pressable>
        <IconButton icon="ellipsis-horizontal" size={18} onPress={onMenu} accessibilityLabel={`${slot.name} options`} />
      </View>
      {slot.entries.length === 0 ? (
        <AppText variant="small" tone="subtle" style={styles.empty}>Nothing planned. Drag a recipe here.</AppText>
      ) : (
        slot.entries.map((entry) => (
          <MenuEntryRow key={entry.id} entry={entry} onPress={() => onEntryPress(entry)} onRemove={() => onEntryRemove(entry)} />
        ))
      )}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  line: { position: "absolute", left: 0, right: 0, height: 3, borderRadius: 2, backgroundColor: t.colors.primary, zIndex: 5 },
  lineTop: { top: -2 },
  lineBottom: { bottom: -2 },
  slot: { marginTop: spacing.xs, borderWidth: 2, borderColor: "transparent", borderRadius: radius.md },
  header: { flexDirection: "row", alignItems: "center", minHeight: 40 },
  nameButton: {
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingRight: spacing.md,
    ...(Platform.OS === "web" ? { cursor: "text" } : null),
  },
  empty: { paddingLeft: 44, paddingBottom: spacing.sm, fontStyle: "italic" },
}));

export default MenuSlot;
