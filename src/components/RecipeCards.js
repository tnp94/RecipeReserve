import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import RecipeCard from "./RecipeCard";
import { AppText } from "./ui";
import useLayout from "../hooks/useLayout";
import { makeStyles, spacing } from "../theme";

// Recipe library: a list of rows on phones, a grid of cards on wider screens.
// `unknown` recipes (they may fit the filters but are missing the time or difficulty to tell)
// go after the matches under a divider titled `unknownTitle`. The library is small, so that
// section renders in the footer rather than being virtualized.
const RecipeCards = ({ recipes, unknown = [], unknownTitle, onAddToMenu, ListHeaderComponent, ListEmptyComponent }) => {
  const { width } = useLayout();
  const styles = useStyles();
  const numColumns = width < 600 ? 1 : width < 900 ? 3 : width < 1200 ? 4 : 5;
  const grid = numColumns > 1;
  const cellWidth = { width: `${100 / numColumns}%` };

  const cell = (item) =>
    grid ? (
      <View style={cellWidth}>
        <RecipeCard recipeId={item.id} layout="grid" onAddToMenu={onAddToMenu} />
      </View>
    ) : (
      <RecipeCard recipeId={item.id} layout="row" onAddToMenu={onAddToMenu} />
    );

  const footer =
    unknown.length > 0 ? (
      <View>
        <View style={[styles.divider, grid && styles.dividerGrid]} accessibilityRole="header">
          <View style={styles.dividerTitle}>
            <AppText variant="smallStrong" tone="muted">{`${unknownTitle} · ${unknown.length}`}</AppText>
            <View style={styles.rule} />
          </View>
          <AppText variant="caption" tone="subtle">
            These might fit. Add the missing details to a recipe to filter it properly.
          </AppText>
        </View>
        {grid ? (
          <View style={styles.gridSection}>
            {unknown.map((item) => (
              <View key={item.id} style={cellWidth}>
                <RecipeCard recipeId={item.id} layout="grid" onAddToMenu={onAddToMenu} />
              </View>
            ))}
          </View>
        ) : (
          unknown.map((item, i) => (
            <View key={item.id}>
              {i > 0 ? <View style={styles.separator} /> : null}
              <RecipeCard recipeId={item.id} layout="row" onAddToMenu={onAddToMenu} />
            </View>
          ))
        )}
      </View>
    ) : null;

  return (
    <FlatList
      key={numColumns}
      data={recipes}
      numColumns={numColumns}
      contentContainerStyle={grid ? styles.gridContent : styles.listContent}
      renderItem={({ item }) => cell(item)}
      ItemSeparatorComponent={grid ? null : () => <View style={styles.separator} />}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={footer}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
};

const useStyles = makeStyles((t) => ({
  listContent: { paddingBottom: spacing.xxl },
  gridContent: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xxl },
  separator: { height: 1, backgroundColor: t.colors.border, marginLeft: spacing.lg + 64 + spacing.md },
  divider: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: 2 },
  dividerGrid: { paddingHorizontal: spacing.sm },
  dividerTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rule: { flex: 1, height: 1, backgroundColor: t.colors.border },
  gridSection: { flexDirection: "row", flexWrap: "wrap" },
}));

export default RecipeCards;
