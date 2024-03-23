import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import RecipeCard from "../components/RecipeCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { recipeList } from "../Recipes";
import RecipeDetailsScreen from "./RecipeDetailsScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import RecipeList from "../components/RecipeList";
import RecipeCards from "../components/RecipeCards";
import SearchFilter from "../components/SearchFilter";
import NewRecipeScreen from "./NewRecipeScreen";
import NewRecipeButton from "../components/NewRecipeButton";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const RecipeListScreen = ({ navigation }) => {
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