import { useLayoutEffect, useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import RecipeCards from "../components/RecipeCards";
import SearchFilter from "../components/SearchFilter";
import RecipeFilters from "../components/RecipeFilters";
import { useAddToMenu } from "../components/menu/AddToMenuSheet";
import { AppText, EmptyState, HeaderButton } from "../components/ui";
import { selectAllRecipes } from "../store/recipesSlice";
import { NO_FILTERS, activeFilterCount, splitRecipes, unknownLabel } from "../domain/recipeSearch";
import useLayout from "../hooks/useLayout";
import { makeStyles, radius, spacing, useTheme } from "../theme";

const byName = (a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, { sensitivity: "base" });

const RecipeListScreen = ({ navigation }) => {
  const theme = useTheme();
  const styles = useStyles();
  const { width } = useLayout();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(NO_FILTERS);
  const allRecipes = useSelector(selectAllRecipes);
  const { recipes, unknown } = useMemo(() => {
    const { matches, unknown } = splitRecipes(allRecipes, { ...filters, query });
    return { recipes: matches.sort(byName), unknown: unknown.sort(byName) };
  }, [allRecipes, query, filters]);
  const filtersOn = filters.favoritesOnly || activeFilterCount(filters) > 0;
  const changeFilters = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const clearFilters = () => setFilters(NO_FILTERS);
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
      <RecipeFilters
        filters={filters}
        onChange={changeFilters}
        onClear={clearFilters}
        shown={recipes.length}
        unknown={unknown.length}
        total={allRecipes.length}
      />
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
        message="Add the meals you cook most, or import them from a link or pasted text. You'll plan your week and build shopping lists from them."
        actionLabel="Add a recipe"
        onAction={newRecipe}
      />
    ) : unknown.length > 0 ? (
      // Nothing is a sure match, but some recipes might be: they're listed under the divider.
      <AppText variant="small" tone="muted" style={styles.noSureMatches}>
        No recipes are sure to match these filters.
      </AppText>
    ) : (
      <EmptyState
        icon="search"
        title="No matches"
        message={filtersOn ? "No recipes match these filters." : "No recipe or ingredient matches your search."}
        actionLabel="Clear filters"
        onAction={() => {
          setQuery("");
          clearFilters();
        }}
      />
    );

  return (
    <View style={styles.screen}>
      <RecipeCards
        recipes={recipes}
        unknown={unknown}
        unknownTitle={unknownLabel(filters)}
        onAddToMenu={openAddToMenu}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
      />
      {addToMenuSheet}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  noSureMatches: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm, gap: spacing.md },
  headerGrid: { paddingHorizontal: spacing.sm },
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
