import { Platform, Pressable, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { makeStyles, radius, spacing, useTheme } from "../../theme";
import { swapMenuEntries } from "../../store/menuSlice";
import { useDropOverStyle } from "./drag/DragProvider";
import DragHandle from "./drag/DragHandle";
import useDropZone from "./drag/useDropZone";
import useLayout from "../../hooks/useLayout";
import { AppText, Badge, RecipeThumb } from "../ui";

const IS_WEB = Platform.OS === "web";

const MenuEntryRow = ({ entry, onPress, onRemove }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const styles = useStyles();
  const dropOverStyle = useDropOverStyle();
  // The wide layout's day columns are narrow: leave the room to the recipe name.
  const { isWide } = useLayout();
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
      <Ionicons name="trash-outline" size={18} color={theme.colors.onDanger} />
      <AppText variant="smallStrong" style={{ color: theme.colors.onDanger }}>Remove</AppText>
    </Pressable>
  );
  const content = (
    <View style={styles.rowWrap}>
      <DragHandle payload={{ type: "entry", id: entry.id }} label={entry.recipe.name} />
      <Pressable
        style={({ hovered }) => [styles.row, hovered && styles.hovered]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Options for ${entry.recipe.name}`}
      >
        {isWide ? null : <RecipeThumb recipe={entry.recipe} size={32} rounded={radius.sm} />}
        <AppText variant="body" style={styles.name} numberOfLines={2}>{entry.recipe.name}</AppText>
        {entry.scale !== 1 ? <Badge label={`×${entry.scale}`} tone="accent" /> : null}
        <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textSubtle} />
      </Pressable>
    </View>
  );
  // Web renders without Swipeable (tapping the row opens the same options, incl. Remove).
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

const useStyles = makeStyles((t) => ({
  zone: { borderWidth: 2, borderColor: "transparent", borderRadius: radius.md },
  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: t.colors.surface,
  },
  row: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  hovered: { backgroundColor: t.colors.surfaceAlt },
  name: { flex: 1 },
  removeAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    backgroundColor: t.colors.danger,
  },
}));

export default MenuEntryRow;
