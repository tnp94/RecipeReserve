import { useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useDispatch } from "react-redux";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useDialog } from "../dialog/DialogProvider";
import { AppText, Badge, IconButton } from "../ui";
import { makeStyles, radius, spacing, useTheme } from "../../theme";
import { deleteItem, removeContribution, toggleItemChecked } from "../../store/shoppingListSlice";
import { toggleStaple } from "../../store/pantrySlice";
import { formatAmount } from "../../domain/quantity";

const IS_WEB = Platform.OS === "web";

// One line on the shopping list. Tap anywhere to check it off. Lines that combine several
// recipes can be expanded to see (and remove) each recipe's portion. Swipe left (phones)
// or "⋯" (web) / long-press for delete and pantry-staple options.
const ShoppingItemRow = ({ item }) => {
  const dispatch = useDispatch();
  const dialog = useDialog();
  const theme = useTheme();
  const styles = useStyles();
  const swipeRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  const contributions = item.contributions ?? [];
  const notes = contributions.filter((c) => c.note);
  const singleNote = contributions.length === 1 && notes.length === 1 ? notes[0].note : "";
  const amount = formatAmount(item.quantityText, item.unit);
  const toggle = () => dispatch(toggleItemChecked(item.id));

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

  const row = (
    <View style={styles.container}>
      <Pressable
        onPress={toggle}
        onLongPress={openMenu}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!item.checked }}
        accessibilityLabel={`${item.name}${amount ? `, ${amount}` : ""}`}
        accessibilityHint={IS_WEB ? undefined : "Long press for more options"}
        style={({ pressed, hovered }) => [styles.main, (pressed || hovered) && styles.mainPressed]}
      >
        <View style={[styles.checkbox, item.checked && styles.checkboxOn]}>
          {item.checked ? <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} /> : null}
        </View>
        <View style={styles.text}>
          <View style={styles.nameRow}>
            <AppText variant="body" style={[styles.name, item.checked && styles.checkedText]} numberOfLines={2}>
              {item.name}
            </AppText>
            {item.isStaple ? <Badge label="Pantry" tone="warning" /> : null}
          </View>
          {singleNote ? (
            <AppText variant="caption" tone="muted" numberOfLines={1}>{singleNote}</AppText>
          ) : null}
          {contributions.length === 1 ? (
            <AppText variant="caption" tone="subtle" numberOfLines={1}>{`for ${contributions[0].recipeName}`}</AppText>
          ) : null}
          {contributions.length >= 2 ? (
            <Pressable
              onPress={() => setExpanded((e) => !e)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${expanded ? "Hide" : "Show"} the ${contributions.length} recipes that need ${item.name}`}
              hitSlop={8}
              style={styles.expander}
            >
              <AppText variant="caption" tone="primary" style={styles.expanderText}>{`${contributions.length} recipes`}</AppText>
              <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={theme.colors.primary} />
            </Pressable>
          ) : null}
        </View>
        {amount ? (
          <AppText variant="smallStrong" style={[styles.qty, item.checked && styles.checkedText]}>{amount}</AppText>
        ) : null}
        {IS_WEB ? (
          <IconButton icon="ellipsis-horizontal" size={18} accessibilityLabel={`More options for ${item.name}`} onPress={openMenu} />
        ) : null}
      </Pressable>
      {expanded && contributions.length >= 2 ? (
        <View style={styles.contribs}>
          {contributions.map((c) => (
            <View key={c.menuEntryId} style={styles.contribRow}>
              <AppText variant="small" tone="muted" style={styles.contribText}>
                <AppText variant="smallStrong" tone="muted">{c.recipeName}</AppText>
                {c.scale !== 1 ? ` (×${c.scale})` : ""}
                {`: ${formatAmount(c.quantityText, item.unit) || "—"}`}
                {c.note ? ` · ${c.note}` : ""}
              </AppText>
              <Pressable
                onPress={() => dispatch(removeContribution({ itemId: item.id, menuEntryId: c.menuEntryId }))}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${c.recipeName}'s ${item.name}`}
                hitSlop={8}
                style={styles.contribRemove}
              >
                <AppText variant="smallStrong" tone="danger">Remove</AppText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  if (IS_WEB) return row;
  return (
    <Swipeable
      ref={swipeRef}
      overshootFriction={8}
      renderRightActions={() => (
        <Pressable
          style={styles.deleteAction}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.name}`}
          onPress={() => {
            swipeRef.current?.close();
            dispatch(deleteItem(item.id));
          }}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.onDanger} />
          <AppText variant="smallStrong" style={{ color: theme.colors.onDanger }}>Delete</AppText>
        </Pressable>
      )}
    >
      {row}
    </Swipeable>
  );
};

const useStyles = makeStyles((t) => ({
  container: { backgroundColor: t.colors.surface },
  main: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  mainPressed: { backgroundColor: t.colors.surfaceAlt },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: t.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  text: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  name: { flexShrink: 1 },
  checkedText: { textDecorationLine: "line-through", color: t.colors.textSubtle },
  expander: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start", marginTop: 2 },
  expanderText: { fontWeight: "600" },
  qty: { color: t.colors.text, maxWidth: 140, textAlign: "right" },
  contribs: { paddingLeft: spacing.lg + 24 + spacing.md, paddingRight: spacing.lg, paddingBottom: spacing.sm, gap: spacing.xs },
  contribRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  contribText: { flex: 1 },
  contribRemove: { minHeight: 32, justifyContent: "center" },
  deleteAction: { width: 96, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: t.colors.danger },
}));

export default ShoppingItemRow;
