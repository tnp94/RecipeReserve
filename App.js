import { NavigationContainer } from "@react-navigation/native";
import { View } from "react-native";
import WelcomeScreen from "./src/screens/WelcomeScreen"
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RecipeListScreen from "./src/screens/RecipeListScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import RecipeDetailsScreen from "./src/screens/RecipeDetailsScreen";
import RecipeList from "./src/components/RecipeList";
import RecipeListNavigator from "./src/screens/RecipeListNavigator";
import { SafeAreaView } from "react-native-safe-area-context";

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
export default function App() {
  return (
    <SafeAreaView style={{flex: 1}}>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="Welcome" component={WelcomeScreen} />
          <Tab.Screen name="RecipeList" component={RecipeListNavigator} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  )
}
