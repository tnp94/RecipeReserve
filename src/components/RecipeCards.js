import { StyleSheet, View, Text, Image, TouchableOpacity, SafeAreaView, Alert } from "react-native";
// import { recipeList } from "../Recipes";
import RecipeDetailsScreen from "../screens/RecipeDetailsScreen";
import { createStackNavigator } from "@react-navigation/stack";
import { FlatList } from "react-native-gesture-handler";
import storage from "../Storage";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import RecipeCard from "./RecipeCard";
import { useDispatch, useSelector } from "react-redux";

Stack = createStackNavigator()
const RecipeCards = ( ) => {
  const navigation = useNavigation()
  const [data, setData] = useState(recipeList)

  const recipeList = useSelector((state) =>  state.recipeList)

  return (
    <View style={{
      flex: 1,
    }}>
      <FlatList
        data={recipeList}
        numColumns={2}
        renderItem={ ({ item, index }) => (
          <View style={{
            flex: 0.5,
            alignContent: "center"
          }}>
            <RecipeCard item={item} index={index}/>
          </View>
        )}
      />
    </View>
  )
}

export default RecipeCards;