import { useNavigation } from "@react-navigation/native";
import { StyleSheet, View, Text, Image } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

const NewRecipeButton = ( ) => {
  const navigation = useNavigation()
  return (
      <TouchableOpacity
      style={{
        backgroundColor: "skyblue",
        padding: 5,
        borderRadius: 7,
        flex: 1,
        justifyContent: "center"
      }}
      onPress={() => (navigation.navigate("Recipe Form"))}>
        <Text>New Recipe</Text>
      </TouchableOpacity>
  )
}

export default NewRecipeButton;