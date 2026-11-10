import { Platform, Pressable, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { memo, useRef } from "react";
import { deleteRecipe, selectAllRecipes, selectRecipeById, toggleFavorite } from "../store/recipesSlice";
import { removeUnusedPhotos } from "../services/recipePhoto";
import { useDialog } from "./dialog/DialogProvider";
import { AppText, IconButton, RecipeThumb } from "./ui";
import { formatMinutes, totalMinutes } from "../domain/format";
import { elevation, makeStyles, radius, spacing, useTheme } from "../theme";

const IS_WEB = Platform.OS === "web";

// One recipe in the library. layout "row" (phones: thumbnail left, swipeable) or "grid"
// (tablets / web: a card with the tile on top). Tap opens the recipe; "+" adds it to the
// menu; long-press or "⋯" opens the action sheet; the star toggles favourite.
// Memoized: it renders in long lists and its props are an id, a string and a stable
// callback, so a card re-renders only when its own recipe (via useSelector) changes.
const RecipeCard = memo(function RecipeCard({ recipeId, layout = "row", onAddToMenu }) {
  const navigation = useNavigation();
  const recipe = useSelector((state) => selectRecipeById(state, recipeId));
  const dispatch = useDispatch();
  const store = useStore();
  const dialog = useDialog();
  const theme = useTheme();
  const styles = useStyles();
  const swipeRef = useRef(null);

  if (!recipe) return null;

  const open = () => navigation.navigate("Recipe Details", { recipeId });
  const addToMenu = () => onAddToMenu && onAddToMenu(recipe);
  const remove = () => {
    dispatch(deleteRecipe(recipeId));
    removeUnusedPhotos(selectAllRecipes(store.getState()));
  };
  const confirmDelete = () => {
    dialog.alert(`Delete "${recipe.name}"?`, "It will also be removed from your menu. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: remove },
    ]);
  };
  const showActions = () => {
    dialog.alert(recipe.name, undefined, [
      { text: "Add to menu", onPress: addToMenu },
      { text: "Edit", onPress: () => navigation.navigate("Recipe Form", { recipeId }) },
      { text: recipe.favorite ? "Remove from favorites" : "Add to favorites", onPress: () => dispatch(toggleFavorite(recipeId)) },
      { text: "Delete", style: "destructive", onPress: confirmDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const minutes = formatMinutes(totalMinutes(recipe));
  const meta = (
    <View style={styles.meta}>
      {minutes ? (
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
          <AppText variant="caption" tone="muted">{minutes}</AppText>
        </View>
      ) : null}
      {recipe.difficulty ? (
        <View style={styles.metaItem}>
          <Ionicons name="speedometer-outline" size={14} color={theme.colors.textMuted} />
          <AppText variant="caption" tone="muted">{recipe.difficulty}</AppText>
        </View>
      ) : null}
      {!minutes && !recipe.difficulty ? (
        <AppText variant="caption" tone="subtle">{`${(recipe.ingredients ?? []).length} ingredients`}</AppText>
      ) : null}
    </View>
  );

  const favorite = (
    <IconButton
      icon={recipe.favorite ? "star" : "star-outline"}
      tone={recipe.favorite ? "accent" : "muted"}
      size={20}
      accessibilityLabel={recipe.favorite ? "Remove from favorites" : "Add to favorites"}
      accessibilityState={{ selected: !!recipe.favorite }}
      onPress={() => dispatch(toggleFavorite(recipeId))}
    />
  );
  const addButton = (
    <IconButton icon="add" variant="tonal" size={20} accessibilityLabel={`Add ${recipe.name} to menu`} onPress={addToMenu} />
  );

  if (layout === "grid") {
    return (
      <Pressable
        onPress={open}
        onLongPress={showActions}
        accessibilityRole="button"
        accessibilityLabel={recipe.name}
        accessibilityHint="Opens the recipe. Long press for more actions."
        style={({ hovered, pressed }) => [styles.gridCard, hovered && styles.hovered, pressed && styles.pressed]}
      >
        <RecipeThumb recipe={recipe} height={120} rounded={0} />
        <View style={styles.gridFavorite}>{favorite}</View>
        <View style={styles.gridBody}>
          <AppText variant="subheading" numberOfLines={2} style={styles.gridTitle}>{recipe.name}</AppText>
          {meta}
        </View>
        <View style={styles.gridActions}>
          <IconButton icon="ellipsis-horizontal" accessibilityLabel={`More actions for ${recipe.name}`} onPress={showActions} />
          {addButton}
        </View>
      </Pressable>
    );
  }

  const row = (
    <Pressable
      onPress={open}
      onLongPress={showActions}
      accessibilityRole="button"
      accessibilityLabel={recipe.name}
      accessibilityHint="Opens the recipe. Long press for more actions."
      style={({ pressed, hovered }) => [styles.row, (pressed || hovered) && styles.rowPressed]}
    >
      <RecipeThumb recipe={recipe} size={64} rounded={radius.md} />
      <View style={styles.rowBody}>
        <AppText variant="subheading" numberOfLines={2}>{recipe.name}</AppText>
        {meta}
      </View>
      {favorite}
      {IS_WEB ? <IconButton icon="ellipsis-horizontal" accessibilityLabel={`More actions for ${recipe.name}`} onPress={showActions} /> : null}
      {addButton}
    </Pressable>
  );
  if (IS_WEB) return row;

  const swipeAction = (label, icon, color, onPress) => (
    <Pressable
      style={[styles.swipeAction, { backgroundColor: color }]}
      accessibilityRole="button"
      onPress={() => {
        swipeRef.current?.close();
        onPress();
      }}
    >
      <Ionicons name={icon} size={20} color={theme.colors.onPrimary} />
      <AppText variant="smallStrong" style={{ color: theme.colors.onPrimary }}>{label}</AppText>
    </Pressable>
  );
  return (
    <Swipeable
      ref={swipeRef}
      overshootFriction={8}
      renderLeftActions={() => swipeAction("Add to menu", "calendar-outline", theme.colors.primary, addToMenu)}
      renderRightActions={() => swipeAction("Delete", "trash-outline", theme.colors.danger, confirmDelete)}
    >
      {row}
    </Swipeable>
  );
});

const useStyles = makeStyles((t) => ({
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.md, marginTop: 2 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    backgroundColor: t.colors.background,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  rowPressed: { backgroundColor: t.colors.surfaceAlt },
  rowBody: { flex: 1, minWidth: 0 },
  swipeAction: { width: 112, alignItems: "center", justifyContent: "center", gap: 4 },
  gridCard: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: t.colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: "hidden",
    ...elevation(t, 1),
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  hovered: { borderColor: t.colors.borderStrong, ...elevation(t, 2) },
  pressed: { opacity: 0.92 },
  gridFavorite: { position: "absolute", top: spacing.xs, right: spacing.xs, backgroundColor: t.colors.surface, borderRadius: radius.pill },
  gridBody: { paddingHorizontal: spacing.md, paddingTop: spacing.md, flex: 1 },
  gridTitle: { minHeight: 44 },
  gridActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: spacing.xs, padding: spacing.xs },
}));

export default RecipeCard;
