import { StyleSheet, View, Text, Image, FlatList } from "react-native";
import { recipeList } from "../Recipes";
import { createStackNavigator } from "@react-navigation/stack";
import RecipeDetailsScreen from "../screens/RecipeDetailsScreen";

const Stack = createStackNavigator();
const RecipeCard = () => {
  return (
    <View>
      <Text>Recipes</Text>
        <FlatList 
        data={recipeList} 
        renderItem={({ item }) => (
      <Stack.Navigator>
          <Stack.Screen name="{item.name}" component={RecipeDetailsScreen} />
            
      </Stack.Navigator>
        )}
        keyExtractor={ item => item.id}
        />
    </View>
  )
}

export default RecipeCard;