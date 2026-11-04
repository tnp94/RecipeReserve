import { useEffect, useState } from "react";
import { View, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import RecipeCards from "../components/RecipeCards";
import SearchFilter from "../components/SearchFilter";
import NewRecipeButton from "../components/NewRecipeButton";
import Chip from "../components/Chip";
import { selectAllRecipes } from "../store/recipesSlice";
import { filterRecipes } from "../domain/recipeSearch";

const RecipeListScreen = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const allRecipes = useSelector(selectAllRecipes);
  const recipes = filterRecipes(allRecipes, { query, favoritesOnly });

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button onPress={() => navigation.navigate("Recipe Finder")} title="What can I make?" />,
    });
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", padding: 5, gap: 5, alignItems: "center", flexWrap: "wrap" }}>
        <SearchFilter placeholder={"Search for a recipe"} value={query} onChangeText={setQuery} />
        <Chip label="★ Favorites" selected={favoritesOnly} onPress={() => setFavoritesOnly((v) => !v)} />
        <NewRecipeButton />
      </View>
      <RecipeCards recipes={recipes} hasAnyRecipes={allRecipes.length > 0} />
    </View>
  );
};

export default RecipeListScreen;
