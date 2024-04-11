import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import RecipeCard from "../components/RecipeCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { recipeList } from "../Recipes";
import RecipeDetailsScreen from "./RecipeDetailsScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import RecipeCards from "../components/RecipeCards";
import RecipeListScreen from "./RecipeListScreen";
import NewRecipeScreen from "./NewRecipeScreen";
import EditRecipeScreen from "./EditRecipeScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const RecipeListNavigator = ({ navigation }) => {
  return (
    <Stack.Navigator>
        <Stack.Screen name="My Recipes" component={RecipeListScreen} />
        <Stack.Screen name="Recipe Details" component={RecipeDetailsScreen} />
        <Stack.Screen name="New Recipe" component={NewRecipeScreen} />
        <Stack.Screen name="Edit Recipe" component={EditRecipeScreen} />
    </Stack.Navigator>
  )
}

export default RecipeListNavigator;