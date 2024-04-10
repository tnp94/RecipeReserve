import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity, Button } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import RecipeCards from "../components/RecipeCards";
import SearchFilter from "../components/SearchFilter";
import NewRecipeButton from "../components/NewRecipeButton";
import { loadRecipeList } from "../store/recipeSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const RecipeListScreen = ({ navigation }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    navigation.setOptions(
      {
        headerRight: () => (
          <Button
            onPress={() => {
              dispatch(loadRecipeList())
            }}
            title="Reset recipes"
          />
        ),
      }
    )
  }, [ ]);

  return (
    <View
    style={{
        flex:1
    }}>
        <View 
        style={{
            flexDirection: "row",
            padding: 5,
            gap: 5,
            alignItems: "stretch"
        }}
        >
            <SearchFilter placeholder={"Search for a recipe"}/>
            <NewRecipeButton />
        </View>
      <RecipeCards />
    </View>
  )
}

export default RecipeListScreen;