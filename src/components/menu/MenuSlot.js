import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";
import { useDispatch } from "react-redux";
import { moveMenuEntry } from "../../store/menuSlice";
import MenuEntryRow from "./MenuEntryRow";
import { IS_WEB, dropOverStyle, useDraggable, useDropTarget } from "./useWebDrag";

const MenuSlot = ({ slot, onRename, onMenu, onEntryPress, onEntryRemove }) => {
  const dispatch = useDispatch();
  const slotRef = useRef(null);
  const headerRef = useRef(null);
  useDraggable(headerRef, { type: "slot", id: slot.id }, IS_WEB);
  const isOver = useDropTarget(
    slotRef,
    {
      accepts: ["entry"],
      onDrop: (p) => {
        if (!slot.entries.some((e) => e.id === p.id)) dispatch(moveMenuEntry({ entryId: p.id, slotId: slot.id }));
      },
    },
    IS_WEB
  );
  return (
  <View ref={slotRef} style={[styles.slot, dropOverStyle(isOver)]}>
    <View ref={headerRef} style={styles.header}>
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
  slot: { marginTop: spacing.sm },
  header: { flexDirection: "row", alignItems: "center", minHeight: 44 },
  nameButton: { flex: 1, minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md },
  name: { fontSize: 15, fontWeight: "bold", color: colors.muted, textTransform: "uppercase" },
  more: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  moreText: { fontSize: 22, color: colors.muted },
  empty: { color: colors.muted, fontStyle: "italic", paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});

export default MenuSlot;
