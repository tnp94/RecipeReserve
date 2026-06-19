import { NavigationContainer } from "@react-navigation/native";
import WelcomeScreen from "./src/screens/WelcomeScreen"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import RecipeListNavigator from "./src/screens/RecipeListNavigator";
import ShoppingListScreen from "./src/screens/ShoppingListScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { persistor, store } from "./src/store/store";
import { PersistGate } from "redux-persist/integration/react";
import MenuScreen from "./src/screens/MenuScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Tab = createBottomTabNavigator()
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <GestureHandlerRootView style={{flex: 1}}>
          <SafeAreaView style={{flex: 1}}>
            <NavigationContainer>
              <Tab.Navigator>
                <Tab.Screen name="Welcome" component={WelcomeScreen} />
                <Tab.Screen name="RecipeList" component={RecipeListNavigator} />
                <Tab.Screen name="Menu" component={MenuScreen} />
                <Tab.Screen name="ShoppingList" component={ShoppingListScreen} />
              </Tab.Navigator>
            </NavigationContainer>
          </SafeAreaView>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  )
}
