import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { persistor, store } from "./src/store/store";
import { selectThemeName } from "./src/store/settingsSlice";
import { selectUncheckedItemCount } from "./src/store/shoppingListSlice";
import { ThemeProvider, typography, useNavigationTheme, useTheme } from "./src/theme";
import { useHeaderOptions } from "./src/navigation/screenOptions";
import HomeScreen from "./src/screens/HomeScreen";
import RecipeListNavigator from "./src/screens/RecipeListNavigator";
import MenuScreen from "./src/screens/MenuScreen";
import ShoppingListScreen from "./src/screens/ShoppingListScreen";
import SettingsNavigator from "./src/screens/SettingsNavigator";
import { DialogProvider } from "./src/components/dialog/DialogProvider";
import { ToastProvider } from "./src/components/toast/ToastProvider";

const Tab = createBottomTabNavigator();
const TAB_ICONS = {
  Home: "home",
  RecipeList: "book",
  Menu: "calendar",
  ShoppingList: "cart",
  Settings: "settings",
};

function Tabs() {
  const theme = useTheme();
  const headerOptions = useHeaderOptions();
  const remaining = useSelector(selectUncheckedItemCount);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerOptions,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSubtle,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarLabelStyle: { ...typography.caption, fontWeight: "600" },
        tabBarIcon: ({ focused, color, size }) => {
          const base = TAB_ICONS[route.name];
          return <Ionicons name={focused ? base : `${base}-outline`} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home", headerShown: false }} />
      <Tab.Screen name="RecipeList" component={RecipeListNavigator} options={{ title: "Recipes", headerShown: false }} />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ title: "Menu" }} />
      <Tab.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{
          title: "Shopping",
          headerTitle: "Shopping list",
          tabBarBadge: remaining > 0 ? (remaining > 99 ? "99+" : remaining) : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.accent, color: theme.colors.onPrimary },
        }}
      />
      <Tab.Screen name="Settings" component={SettingsNavigator} options={{ title: "Settings", headerShown: false }} />
    </Tab.Navigator>
  );
}

function ThemedApp() {
  const theme = useTheme();
  const navigationTheme = useNavigationTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaProvider>
        <StatusBar style={theme.dark ? "light" : "dark"} />
        <DialogProvider>
          <ToastProvider>
            <NavigationContainer theme={navigationTheme}>
              <Tabs />
            </NavigationContainer>
          </ToastProvider>
        </DialogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemeFromSettings({ children }) {
  const name = useSelector(selectThemeName);
  return <ThemeProvider name={name}>{children}</ThemeProvider>;
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <ThemeFromSettings>
          <ThemedApp />
        </ThemeFromSettings>
      </PersistGate>
    </Provider>
  );
}
