import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";
import { useDispatch } from "react-redux";
import { moveMenuEntry, reorderSlot } from "../../store/menuSlice";
import MenuEntryRow from "./MenuEntryRow";
import { dropOverStyle } from "./drag/DragProvider";
import DragHandle from "./drag/DragHandle";
import useDropZone from "./drag/useDropZone";

const MenuSlot = ({ slot, onRename, onMenu, onEntryPress, onEntryRemove }) => {
  const dispatch = useDispatch();
  const { ref, isOver, hoverHalf, activeType, activeId } = useDropZone({
    key: `slot:${slot.id}`,
    accepts: ["entry", "slot"],
    onDrop: (p, info) => {
      if (p.type === "slot") {
        if (p.id === slot.id) return;
        const rect = info && info.rect;
        const position = rect && info.y >= rect.y + rect.h / 2 ? "after" : "before";
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
      <View
        pointerEvents="none"
        style={[styles.line, hoverHalf === "after" ? styles.lineBottom : styles.lineTop]}
      />
    ) : null}
    <View style={styles.header}>
      <DragHandle payload={{ type: "slot", id: slot.id }} label={slot.name} />
      <Pressable style={styles.nameButton} onPress={onRename} accessibilityRole="button" accessibilityLabel={`Rename ${slot.name}`}>
        <Text style={styles.name} numberOfLines={1}>{slot.name}</Text>
      </Pressable>
      <Pressable style={styles.more} onPress={onMenu} accessibilityRole="button" accessibilityLabel={`${slot.name} options`}>
        <Text style={styles.moreText}>{"⋯"}</Text>
      </Pressable>
    </View>
    {slot.entries.length === 0 ? (
      <Text style={styles.empty}>Nothing planned</Text>
    ) : (
      slot.entries.map((entry) => (
        <MenuEntryRow
          key={entry.id}
          entry={entry}
          onPress={() => onEntryPress(entry)}
          onRemove={() => onEntryRemove(entry)}
        />
      ))
    )}
  </View>
  );
};

const styles = StyleSheet.create({
  line: { position: "absolute", left: 0, right: 0, height: 3, backgroundColor: colors.accentStrong, zIndex: 5 },
  lineTop: { top: -2 },
  lineBottom: { bottom: -2 },
  slot: { marginTop: spacing.sm, borderWidth: 2, borderColor: "transparent" },
  header: { flexDirection: "row", alignItems: "center", minHeight: 44 },
  nameButton: { flex: 1, minHeight: 44, justifyContent: "center", paddingRight: spacing.md },
  name: { fontSize: 15, fontWeight: "bold", color: colors.muted, textTransform: "uppercase" },
  more: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  moreText: { fontSize: 22, color: colors.muted },
  empty: { color: colors.muted, fontStyle: "italic", paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});

export default MenuSlot;
