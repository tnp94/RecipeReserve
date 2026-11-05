import { createStackNavigator } from "@react-navigation/stack";
import RecipeDetailsScreen from "./RecipeDetailsScreen";
import RecipeListScreen from "./RecipeListScreen";
import RecipeFormScreen from "./RecipeFormScreen";
import RecipeFinderScreen from "./RecipeFinderScreen";
import { useHeaderOptions } from "../navigation/screenOptions";

const Stack = createStackNavigator();

const RecipeListNavigator = () => {
  const headerOptions = useHeaderOptions();
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="My Recipes" component={RecipeListScreen} options={{ title: "Recipes" }} />
      <Stack.Screen name="Recipe Details" component={RecipeDetailsScreen} options={{ title: "" }} />
      <Stack.Screen name="Recipe Form" component={RecipeFormScreen} options={{ title: "New recipe" }} />
      <Stack.Screen name="Recipe Finder" component={RecipeFinderScreen} options={{ title: "What can I make?" }} />
    </Stack.Navigator>
  );
};

export default RecipeListNavigator;
