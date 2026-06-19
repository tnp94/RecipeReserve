import { createStackNavigator } from "@react-navigation/stack";
import RecipeDetailsScreen from "./RecipeDetailsScreen";
import RecipeListScreen from "./RecipeListScreen";
import NewRecipeScreen from "./NewRecipeScreen";
import EditRecipeScreen from "./EditRecipeScreen";

const Stack = createStackNavigator();
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