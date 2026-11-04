import { NavigationContainer } from "@react-navigation/native";
import WelcomeScreen from "./src/screens/WelcomeScreen"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import RecipeListNavigator from "./src/screens/RecipeListNavigator";
import ShoppingListScreen from "./src/screens/ShoppingListScreen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { persistor, store } from "./src/store/store";
import { PersistGate } from "redux-persist/integration/react";
import MenuScreen from "./src/screens/MenuScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SettingsNavigator from "./src/screens/SettingsNavigator";
import { DialogProvider } from "./src/components/dialog/DialogProvider";
import { ToastProvider } from "./src/components/toast/ToastProvider";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator()
const TAB_ICONS = {
  Welcome: "home",
  RecipeList: "book",
  Menu: "calendar",
  ShoppingList: "cart",
  Settings: "settings",
}
const screenOptions = ({ route }) => ({
  tabBarActiveTintColor: colors.accentStrong,
  tabBarIcon: ({ focused, color, size }) => {
    const base = TAB_ICONS[route.name]
    return <Ionicons name={focused ? base : `${base}-outline`} size={size} color={color} />
  },
})
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <GestureHandlerRootView style={{flex: 1}}>
          <SafeAreaProvider>
          <SafeAreaView style={{flex: 1}}>
            <DialogProvider>
            <ToastProvider>
            <NavigationContainer>
              <Tab.Navigator screenOptions={screenOptions}>
                <Tab.Screen name="Welcome" component={WelcomeScreen} options={{ title: "Home" }} />
                <Tab.Screen name="RecipeList" component={RecipeListNavigator} options={{ title: "Recipes", headerShown: false }} />
                <Tab.Screen name="Menu" component={MenuScreen} options={{ title: "Menu" }} />
                <Tab.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: "Shopping List" }} />
                <Tab.Screen name="Settings" component={SettingsNavigator} options={{ title: "Settings", headerShown: false }} />
              </Tab.Navigator>
            </NavigationContainer>
            </ToastProvider>
            </DialogProvider>
          </SafeAreaView>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  )
}
