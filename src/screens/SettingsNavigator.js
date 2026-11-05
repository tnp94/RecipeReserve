import { createStackNavigator } from "@react-navigation/stack";
import SettingsScreen from "./SettingsScreen";
import PantryStaplesScreen from "./PantryStaplesScreen";
import { useHeaderOptions } from "../navigation/screenOptions";

const Stack = createStackNavigator();

const SettingsNavigator = () => {
  const headerOptions = useHeaderOptions();
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Pantry Staples" component={PantryStaplesScreen} options={{ title: "Pantry staples" }} />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
