import { StyleSheet, View, Text, Image, FlatList, Alert } from "react-native";
import { recipeList } from "../Recipes";
import { createStackNavigator } from "@react-navigation/stack";
import RecipeDetailsScreen from "../screens/RecipeDetailsScreen";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { deleteRecipe } from "../store/recipeListSlice";
import { addRecipeToMenu } from "../store/menuSlice";

const RecipeCard = ({ item, index }) => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  
  function recipeLongPress(index) {
    Alert.alert('Recipe actions', 'My Alert Msg', [
    {
      text: 'Cancel',
      onPress: () => console.log('Cancel Pressed'),
      style: 'cancel',
    },
    {text: 'Add to menu', onPress: () => dispatch(addRecipeToMenu(item))},
    {text: 'Delete', onPress: () => dispatch(deleteRecipe(index))},
    ]);
  }

  return (
    <TouchableOpacity 
        onPress={() => navigation.navigate("Recipe Details",  { item } )}
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
          }}>{index} {item.name}</Text>
          <Text 
          style={{
            fontSize: 12,
          }}>
            Time: {(item.time.prep + item.time.active) !== 0 ? ( + (item.time.prep + item.time.active) + " minutes") : "?"}
            {item.difficulty !== "" && (" | Difficulty: " + item.difficulty)}
          </Text>
        </TouchableOpacity>
  )
}

export default RecipeCard;