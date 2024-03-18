import { StyleSheet, View, Text, Image, TextInput } from "react-native";

const SearchFilter = ( { navigation, placeholder}) => {
  return (
    <View style={{
      padding: 5,
      backgroundColor: "#fff",
      borderRadius: 7,
      flexDirection: "row",
      alignItems: "center",
      flex: 1
    }}>
      <Image style={{
        width: 20,
        height: 20,
      }} source={require("../../assets/images/ForkAndSpoon.png")} />
      <TextInput
      style={{
        flex: 1,
        padding: 10,
      }}
      placeholder={placeholder}>
      </TextInput>
    </View>
  )
}

export default SearchFilter;