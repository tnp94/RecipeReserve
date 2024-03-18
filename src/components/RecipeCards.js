import { StyleSheet, View, Text, Image, TouchableOpacity, SafeAreaView } from "react-native";
import { recipeList } from "../Recipes";
import RecipeDetailsScreen from "../screens/RecipeDetailsScreen";
import { createStackNavigator } from "@react-navigation/stack";
import { FlatList } from "react-native-gesture-handler";

Stack = createStackNavigator()
const RecipeCards = ( { navigation } ) => {
  return (
    <View style={{flex: 1}}>
      <FlatList
      // {recipeList.map(( item ) => (
        data={recipeList}
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