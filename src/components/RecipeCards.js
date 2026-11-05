import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import RecipeCard from "./RecipeCard";
import useLayout from "../hooks/useLayout";
import { makeStyles, spacing } from "../theme";

// Recipe library: a list of rows on phones, a grid of cards on wider screens.
const RecipeCards = ({ recipes, onAddToMenu, ListHeaderComponent, ListEmptyComponent }) => {
  const { width } = useLayout();
  const styles = useStyles();
  const numColumns = width < 600 ? 1 : width < 900 ? 3 : width < 1200 ? 4 : 5;
  const grid = numColumns > 1;

  return (
    <FlatList
      key={numColumns}
      data={recipes}
      numColumns={numColumns}
      contentContainerStyle={grid ? styles.gridContent : styles.listContent}
      renderItem={({ item }) =>
        grid ? (
          <View style={{ width: `${100 / numColumns}%` }}>
            <RecipeCard recipeId={item.id} layout="grid" onAddToMenu={onAddToMenu} />
          </View>
        ) : (
          <RecipeCard recipeId={item.id} layout="row" onAddToMenu={onAddToMenu} />
        )
      }
      ItemSeparatorComponent={grid ? null : () => <View style={styles.separator} />}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
};

const useStyles = makeStyles((t) => ({
  listContent: { paddingBottom: spacing.xxl },
  gridContent: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xxl },
  separator: { height: 1, backgroundColor: t.colors.border, marginLeft: spacing.lg + 64 + spacing.md },
}));

export default RecipeCards;
