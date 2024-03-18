import { StyleSheet, View, Text, Image } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

const NewRecipeButton = ( { navigation }) => {
  return (
      <TouchableOpacity
      style={{
        backgroundColor: "skyblue",
        padding: 5,
        borderRadius: 7,
        flex: 1,
        justifyContent: "center"
      }}
      onPress={() => (navigation.navigate("New Recipe"))}>
        <Text>New Recipe</Text>
      </TouchableOpacity>
  )
}

export default NewRecipeButton;