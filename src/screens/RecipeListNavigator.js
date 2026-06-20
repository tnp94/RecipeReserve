import { createStackNavigator } from "@react-navigation/stack";
import RecipeDetailsScreen from "./RecipeDetailsScreen";
import RecipeListScreen from "./RecipeListScreen";
import RecipeFormScreen from "./RecipeFormScreen";

const Stack = createStackNavigator();
const RecipeListNavigator = ({ navigation }) => {
  return (
    <Stack.Navigator>
        <Stack.Screen name="My Recipes" component={RecipeListScreen} />
        <Stack.Screen name="Recipe Details" component={RecipeDetailsScreen} />
        <Stack.Screen name="Recipe Form" component={RecipeFormScreen} />
    </Stack.Navigator>
  )
}

export default RecipeListNavigator;