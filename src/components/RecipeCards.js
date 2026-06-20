import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import RecipeCard from "./RecipeCard";
import { useSelector } from "react-redux";
import { selectAllRecipes } from "../store/recipesSlice";

const RecipeCards = () => {
  const navigation = useNavigation()
  const recipes = useSelector(selectAllRecipes)

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={recipes}
        numColumns={2}
        renderItem={({ item, index }) => (
          <View style={{ flex: 0.5, alignContent: "center" }}>
            <RecipeCard recipeId={item.id} index={index} />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  )
}

export default RecipeCards;
