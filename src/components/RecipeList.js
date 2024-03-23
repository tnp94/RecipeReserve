import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
// import { recipeList } from "../Recipes";
import RecipeDetailsScreen from "../screens/RecipeDetailsScreen";
import { createStackNavigator } from "@react-navigation/stack";
import storage from "../Storage";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

Stack = createStackNavigator()
const navigation = useNavigation()
const RecipeList = ( ) => {

  useEffect(() => {
    const focusHandler = navigation.addListener('focus', () => {
        console.log('Refreshed');
        fetchRecipes()
    });
    return focusHandler;
  }, [navigation]);
  
  fetchRecipes = () => {
    this.recipeList = storage.load({
      key: "recipeList"
    })
  }
  
  return (
    <View style={{}}>
      {this.recipeList.map(( item ) => (
        <TouchableOpacity 
        onPress={() => navigation.navigate("Recipe Details",  { item } )}
        key={item.id}
        style={{
          margin: 2,
          padding: 5,
          backgroundColor: '#fff',
          borderColor: "#333",
          borderRadius: 16,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          shadowOffset: {
            width: 0,
            height: 4
          },
          shadowColor: "#000",
          shadowOpacity: 0.1
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
            padding: 5
          }}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default RecipeList;