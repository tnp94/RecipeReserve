import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import RecipeCard from "../components/RecipeCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { recipeList } from "../Recipes";
import RecipeDetailsScreen from "./RecipeDetailsScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import RecipeList from "../components/RecipeList";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const RecipeListScreen = ({ navigation }) => {
  return (
    <Stack.Navigator>
        <Stack.Screen name="My Recipes" component={RecipeList} />
        <Stack.Screen name="Recipe Details" component={RecipeDetailsScreen} />
    </Stack.Navigator>
  )
}

export default RecipeListScreen;