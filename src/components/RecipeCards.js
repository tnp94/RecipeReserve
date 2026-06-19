import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import RecipeCard from "./RecipeCard";
import { useSelector } from "react-redux";
const RecipeCards = ( ) => {
  const navigation = useNavigation()
  const recipeList = useSelector((state) =>  state.recipes)

  return (
    <View style={{
      flex: 1,
    }}>
      <FlatList
        data={Object.keys(recipeList)}
        numColumns={2}
        renderItem={ ({ item, index }) => (
          <View style={{
            flex: 0.5,
            alignContent: "center"
          }}>
            <RecipeCard recipeName={item} index={index}/>
          </View>
        )}
        keyExtractor={(item) => item}
      />
    </View>
  )
}

export default RecipeCards;