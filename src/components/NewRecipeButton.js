import { useNavigation } from "@react-navigation/native";
import { Text, TouchableOpacity } from "react-native";

const NewRecipeButton = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={{
        backgroundColor: "skyblue",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 7,
        justifyContent: "center",
      }}
      onPress={() => navigation.navigate("Recipe Form")}
    >
      <Text>New Recipe</Text>
    </TouchableOpacity>
  );
};

export default NewRecipeButton;
