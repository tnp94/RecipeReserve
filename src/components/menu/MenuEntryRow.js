import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useDispatch } from "react-redux";
import { colors, radius, spacing } from "../../theme";
import { swapMenuEntries } from "../../store/menuSlice";
import { dropOverStyle } from "./drag/DragProvider";
import DragHandle from "./drag/DragHandle";
import useDropZone from "./drag/useDropZone";

const IS_WEB = Platform.OS === "web";

const MenuEntryRow = ({ entry, onPress, onRemove }) => {
  const dispatch = useDispatch();
  const { ref, isOver } = useDropZone({
    key: `entry:${entry.id}`,
    accepts: ["entry"],
    onDrop: (p) => {
      if (p.id !== entry.id) dispatch(swapMenuEntries({ entryIdA: p.id, entryIdB: entry.id }));
    },
  });
  const renderRightActions = () => (
    <Pressable
      style={styles.removeAction}
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${entry.recipe.name}`}
    >
      <Text style={styles.removeText}>Remove</Text>
    </Pressable>
  );
  const content = (
    <View style={styles.rowWrap}>
      <DragHandle payload={{ type: "entry", id: entry.id }} label={entry.recipe.name} />
      <Pressable
        style={styles.row}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Options for ${entry.recipe.name}`}
      >
        <Text style={styles.name} numberOfLines={2}>{entry.recipe.name}</Text>
        {entry.scale !== 1 ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{`×${entry.scale}`}</Text></View>
        ) : null}
        {IS_WEB ? <Text style={styles.more}>{"⋯"}</Text> : null}
      </Pressable>
    </View>
  );
  // Web renders without Swipeable (the "⋯" affordance opens the same options on tap).
  return (
    <View ref={ref} collapsable={false} style={[styles.zone, dropOverStyle(isOver)]}>
      {IS_WEB ? (
        content
      ) : (
        <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
          {content}
        </Swipeable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  zone: { borderWidth: 2, borderColor: "transparent" },
  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: { flex: 1, fontSize: 16, color: colors.text },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeText: { fontSize: 13, fontWeight: "bold", color: colors.text },
  more: { fontSize: 22, color: colors.muted, paddingHorizontal: spacing.sm },
  removeAction: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.danger,
    justifyContent: "center",
  },
  removeText: { color: "#fff", fontWeight: "bold" },
});

export default MenuEntryRow;
