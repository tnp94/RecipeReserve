import { StyleSheet, View, Text, Image, FlatList, Alert } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { deleteRecipe } from "../store/recipesSlice";
import { addRecipeToMenu } from "../store/menuSlice";

const RecipeCard = ({ recipeName, index }) => {
  const navigation = useNavigation()
  const recipe = useSelector((state) => state.recipes[recipeName])
  const dispatch = useDispatch()
  
  function recipeLongPress(index) {
    Alert.alert('Recipe actions', 'My Alert Msg', [
    {
      text: 'Cancel',
      onPress: () => console.log('Cancel Pressed'),
      style: 'cancel',
    },
    {text: 'Add to menu', onPress: () => dispatch(addRecipeToMenu(recipe))},
    {text: 'Delete', onPress: () => dispatch(deleteRecipe(recipeName))},
    ]);
  }

  if (recipe) 
    return (
      <TouchableOpacity 
      onPress={() => navigation.navigate("Recipe Details",  { recipeName } )}
      onLongPress={() => {recipeLongPress(index)}}
      key={index}
      style={{
        margin: 5,
        padding: 5,
        backgroundColor: '#fff',
        borderColor: "#333",
        borderRadius: 16,
        alignItems: "center",
        shadowOffset: {
          width: 0,
          height: 4
        },
        shadowColor: "#000",
        shadowOpacity: 0.1,
        flex: 1
      }}
      >
        <Image
        style={{
          width: 70,
          height: 70,
          borderRadius: 20
        }}
        source={require("../../assets/images/ForkAndSpoon.png")} />
        <Text style={{
          flexWrap: "wrap",
          flex: 1,
          paddingHorizontal: 5,
        }}>{index} {recipe.name}</Text>
        <Text 
        style={{
          fontSize: 12,
        }}>
          Time: {(recipe.time.prep + recipe.time.active) !== 0 ? ( + (recipe.time.prep + recipe.time.active) + " minutes") : "?"}
          {recipe.difficulty !== "" && (" | Difficulty: " + recipe.difficulty)}
        </Text>
      </TouchableOpacity>
    )
}

export default RecipeCard;