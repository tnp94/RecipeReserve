import { createStackNavigator } from "@react-navigation/stack";
import SettingsScreen from "./SettingsScreen";
import PantryStaplesScreen from "./PantryStaplesScreen";

const Stack = createStackNavigator();

const SettingsNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Pantry Staples" component={PantryStaplesScreen} />
  </Stack.Navigator>
);

export default SettingsNavigator;
