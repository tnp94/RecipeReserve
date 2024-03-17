import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { recipeList } from "../Recipes";
import RecipeDetailsScreen from "../screens/RecipeDetailsScreen";
import { createStackNavigator } from "@react-navigation/stack";

Stack = createStackNavigator()
const RecipeList = ( { navigation } ) => {
  return (
    <View>
      {recipeList.map(( item ) => (
        <TouchableOpacity 
        onPress={() => navigation.navigate("Recipe Details",  { item } )}
        key={item.id}
        style={{
          margin: 2,
          padding: 3,
          borderColor: '#999',
          borderWidth: 2,
          borderRadius: 3,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
        >
          <Image
          style={{
            width: 80,
            height: 80
          }}
          source={require("../../assets/images/ForkAndSpoon.png")} />
          <Text style={{
            flexWrap: "wrap",
            flex: 1
          }}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default RecipeList;