import { StyleSheet, View, Text, Image, TouchableOpacity, SafeAreaView } from "react-native";
// import { recipeList } from "../Recipes";
import RecipeDetailsScreen from "../screens/RecipeDetailsScreen";
import { createStackNavigator } from "@react-navigation/stack";
import { FlatList } from "react-native-gesture-handler";
import storage from "../Storage";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";

Stack = createStackNavigator()
const RecipeCards = ( ) => {
  const navigation = useNavigation()
  const [data, setData] = useState(recipeList)
  var recipeList = []

  
  useEffect(() => {
    const focusHandler = navigation.addListener('focus', () => {
        console.log('Refreshed');
        fetchRecipes()
    });
    return focusHandler;
  }, [navigation]);
  
  fetchRecipes = () => {
    storage.load({
      key: "recipeList"
    }).then(ret => {
      setData(ret)
    })
  }


  return (
    <View style={{flex: 1}}>
      <FlatList
      // {recipeList.map(( item ) => (
        data={data}
        numColumns={2}
        renderItem={ ({ item }) => (
        <TouchableOpacity 
        onPress={() => navigation.navigate("Recipe Details",  { item } )}
        key={item.id}
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
          flex: 0.5
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
          }}>{item.name}</Text>
          <Text 
          style={{
            fontSize: 12,
          }}>
            Time: {(item.time.prep + item.time.active) !== 0 ? ( + (item.time.prep + item.time.active) + " minutes") : "?"}
            {item.difficulty !== "" && (" | Difficulty: " + item.difficulty)}
          </Text>
        </TouchableOpacity>
      )}
      />
    </View>
  )
}

export default RecipeCards;