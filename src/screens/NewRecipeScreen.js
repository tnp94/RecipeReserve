import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, View, Text, Image } from "react-native";
import { TextInput } from "react-native-gesture-handler";

const NewRecipeScreen = () => {
  return (
    <View
    style={{
      padding: 5
    }}
    >
        <Text
        style={{
          fontSize: 32,
          alignSelf: "center",
          marginBottom: 10
        }}
        >
          Let's add a new Recipe!
        </Text>
      <View
      style={{
        marginBottom: 10
      }}
      >
        <Text
        style={{
          fontSize: 24
        }}
        >
          Recipe Name
        </Text>
        <TextInput 
        style={{
          backgroundColor: "#fff",
          padding: 5
        }}
        placeholder="Recipe Name">

        </TextInput>
      </View>
      <View
      style={{
        marginBottom: 10
      }}
      >
        <Text
        style={{
          fontSize: 24
        }}
        >
          Recipe difficulty
        </Text>
        <TextInput 
        style={{
          backgroundColor: "#fff",
          padding: 5
        }}
        placeholder="Easy/Medium/Hard">

        </TextInput>
      </View>

    </View>
  )
}

export default NewRecipeScreen;