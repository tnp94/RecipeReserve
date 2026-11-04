import { StyleSheet, View, Text, Image, TextInput, TouchableOpacity } from "react-native";
import { colors } from "../theme";

const SearchFilter = ({ placeholder, value, onChangeText }) => {
  return (
    <View style={styles.container}>
      <Image style={styles.icon} source={require("../../assets/images/ForkAndSpoon.png")} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
      />
      {!!value && (
        <TouchableOpacity
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          onPress={() => onChangeText && onChangeText("")}
          style={styles.clear}
        >
          <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
    backgroundColor: "#fff",
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 0,
  },
  icon: { width: 20, height: 20 },
  input: { flex: 1, minWidth: 0, padding: 10 },
  clear: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});

export default SearchFilter;
