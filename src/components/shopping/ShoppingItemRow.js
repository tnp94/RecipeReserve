import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";
import { Swipeable } from "react-native-gesture-handler";
import { useDialog } from "../dialog/DialogProvider";
import { colors, radius, spacing } from "../../theme";
import { deleteItem, removeContribution, toggleItemChecked } from "../../store/shoppingListSlice";
import { toggleStaple } from "../../store/pantrySlice";

const joinQty = (quantityText, unit) => `${quantityText ?? ""} ${unit ?? ""}`.trim();

const ShoppingItemRow = ({ item }) => {
  const dispatch = useDispatch();
  const dialog = useDialog();
  const [expanded, setExpanded] = useState(false);

  const contributions = item.contributions ?? [];
  const notes = contributions.filter((c) => c.note);
  const singleNote = contributions.length === 1 && notes.length === 1 ? notes[0].note : "";
  const displayName = singleNote ? `${item.name} (${singleNote})` : item.name;

  const openMenu = () => {
    dialog.alert(item.name, undefined, [
      {
        text: item.isStaple ? "Remove from pantry staples" : "Mark as pantry staple",
        onPress: () => dispatch(toggleStaple(item.name)),
      },
      { text: "Delete item", style: "destructive", onPress: () => dispatch(deleteItem(item.id)) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderRightActions = () => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => dispatch(deleteItem(item.id))}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootFriction={8}>
      <View style={styles.container}>
        <Pressable onLongPress={openMenu} style={styles.main}>
          <View style={styles.left}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, item.checked && styles.checkedText]} numberOfLines={2}>
                {displayName}
              </Text>
              {item.isStaple ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Pantry</Text>
                </View>
              ) : null}
            </View>
            {contributions.length === 1 ? (
              <Text style={styles.sub}>for {contributions[0].recipeName}</Text>
            ) : null}
            {contributions.length >= 2 ? (
              <Pressable onPress={() => setExpanded((e) => !e)} accessibilityRole="button" hitSlop={6}>
                <Text style={styles.sub}>
                  {expanded ? "▾" : "▸"} {contributions.length} recipes
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={[styles.qty, item.checked && styles.checkedText]}>
            {joinQty(item.quantityText, item.unit)}
          </Text>
          {Platform.OS === "web" ? (
            <Pressable onPress={openMenu} accessibilityLabel={`More options for ${item.name}`} accessibilityRole="button" style={styles.more}>
              <Text style={styles.moreText}>⋯</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => dispatch(toggleItemChecked(item.id))}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!item.checked }}
            accessibilityLabel={`${item.checked ? "Uncheck" : "Check"} ${item.name}`}
            style={styles.checkHit}
          >
            <View style={styles.checkbox}>
              {item.checked ? <View style={styles.checkInner} /> : null}
            </View>
          </Pressable>
        </Pressable>
        {expanded && contributions.length >= 2
          ? contributions.map((c) => (
              <View key={c.menuEntryId} style={styles.contribRow}>
                <Text style={styles.contribText}>
                  {c.recipeName}
                  {c.scale !== 1 ? ` (×${c.scale})` : ""}: {joinQty(c.quantityText, item.unit) || "—"}
                  {c.note ? ` · ${c.note}` : ""}
                </Text>
                <Pressable
                  onPress={() => dispatch(removeContribution({ itemId: item.id, menuEntryId: c.menuEntryId }))}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            ))
          : null}
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  main: { flexDirection: "row", alignItems: "center", minHeight: 48, paddingVertical: spacing.xs },
  left: { flex: 1, paddingRight: spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  name: { fontSize: 16, color: colors.text, flexShrink: 1 },
  checkedText: { textDecorationLine: "line-through", color: colors.muted },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  qty: { fontSize: 15, color: colors.text, marginRight: spacing.sm },
  pill: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, color: colors.text },
  more: { minWidth: 36, minHeight: 44, alignItems: "center", justifyContent: "center" },
  moreText: { fontSize: 20, color: colors.muted },
  checkHit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  checkbox: {
    width: 22, height: 22, borderWidth: 2, borderColor: "#555", borderRadius: 3,
    alignItems: "center", justifyContent: "center",
  },
  checkInner: { width: 12, height: 12, backgroundColor: "#555", borderRadius: 2 },
  contribRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingLeft: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm,
  },
  contribText: { flex: 1, fontSize: 13, color: colors.muted },
  removeText: { fontSize: 13, color: colors.danger },
  deleteAction: { justifyContent: "center", paddingHorizontal: spacing.lg, backgroundColor: colors.surface },
  deleteText: { color: colors.danger, fontSize: 16 },
});

export default ShoppingItemRow;
