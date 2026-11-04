import { View, Text } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import RecipeCard from "./RecipeCard";
import useLayout from "../hooks/useLayout";
import { colors } from "../theme";

const RecipeCards = ({ recipes, hasAnyRecipes = true }) => {
  const { width } = useLayout();
  const numColumns = width < 600 ? 2 : width < 900 ? 3 : width < 1200 ? 4 : 5;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        key={numColumns}
        data={recipes}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <View style={{ width: `${100 / numColumns}%` }}>
            <RecipeCard recipeId={item.id} />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: colors.muted, padding: 24 }}>
            {hasAnyRecipes
              ? "No recipes match your search."
              : "No recipes yet. Tap New Recipe to add one."}
          </Text>
        }
      />
    </View>
  );
};

export default RecipeCards;
