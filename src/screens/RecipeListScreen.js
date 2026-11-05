import { useLayoutEffect, useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import RecipeCards from "../components/RecipeCards";
import SearchFilter from "../components/SearchFilter";
import Chip from "../components/Chip";
import { useAddToMenu } from "../components/menu/AddToMenuSheet";
import { AppText, EmptyState, HeaderButton } from "../components/ui";
import { selectAllRecipes } from "../store/recipesSlice";
import { filterRecipes } from "../domain/recipeSearch";
import useLayout from "../hooks/useLayout";
import { makeStyles, radius, spacing, useTheme } from "../theme";

const byName = (a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, { sensitivity: "base" });

const RecipeListScreen = ({ navigation }) => {
  const theme = useTheme();
  const styles = useStyles();
  const { width } = useLayout();
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const allRecipes = useSelector(selectAllRecipes);
  const recipes = useMemo(
    () => filterRecipes(allRecipes, { query, favoritesOnly }).slice().sort(byName),
    [allRecipes, query, favoritesOnly]
  );
  const { openAddToMenu, addToMenuSheet } = useAddToMenu();
  const newRecipe = () => navigation.navigate("Recipe Form");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ marginRight: spacing.md }}>
          <HeaderButton label="New recipe" icon="add" filled onPress={newRecipe} />
        </View>
      ),
    });
  }, [navigation]);

  const header = (
    <View style={[styles.header, width >= 600 && styles.headerGrid]}>
      <SearchFilter placeholder="Search recipes or ingredients" value={query} onChangeText={setQuery} />
      <View style={styles.filters}>
        <Chip
          label="Favorites"
          icon={favoritesOnly ? "star" : "star-outline"}
          selected={favoritesOnly}
          onPress={() => setFavoritesOnly((v) => !v)}
        />
        <AppText variant="small" tone="muted" style={styles.count}>
          {`${recipes.length} of ${allRecipes.length}`}
        </AppText>
      </View>
      <Pressable
        onPress={() => navigation.navigate("Recipe Finder")}
        accessibilityRole="button"
        accessibilityLabel="What can I make? Find recipes from ingredients you have"
        style={({ pressed, hovered }) => [styles.finder, (pressed || hovered) && styles.finderPressed]}
      >
        <View style={styles.finderIcon}>
          <Ionicons name="sparkles-outline" size={20} color={theme.colors.onAccentSoft} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">What can I make?</AppText>
          <AppText variant="small" tone="muted">Enter what you have, get matching recipes.</AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSubtle} />
      </Pressable>
    </View>
  );

  const empty =
    allRecipes.length === 0 ? (
      <EmptyState
        icon="book-outline"
        title="No recipes yet"
        message="Add the meals you cook most. You'll plan your week and build shopping lists from them."
        actionLabel="Add a recipe"
        onAction={newRecipe}
      />
    ) : (
      <EmptyState
        icon="search"
        title="No matches"
        message={favoritesOnly ? "No favorites match your search." : "No recipe or ingredient matches your search."}
        actionLabel="Clear filters"
        onAction={() => {
          setQuery("");
          setFavoritesOnly(false);
        }}
      />
    );

  return (
    <View style={styles.screen}>
      <RecipeCards recipes={recipes} onAddToMenu={openAddToMenu} ListHeaderComponent={header} ListEmptyComponent={empty} />
      {addToMenuSheet}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm, gap: spacing.md },
  headerGrid: { paddingHorizontal: spacing.sm },
  filters: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  count: { marginLeft: "auto" },
  finder: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: t.colors.accentSoft,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  finderPressed: { opacity: 0.85 },
  finderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
}));

export default RecipeListScreen;
