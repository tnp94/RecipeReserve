import { StyleSheet, View } from "react-native";
import Chip from "./Chip";
import { INGREDIENTCATEGORIES } from "../Models/Ingredient";

const CategoryPicker = ({ value, onChange }) => (
  <View style={styles.row}>
    {Object.values(INGREDIENTCATEGORIES).map((category) => (
      <Chip
        key={category}
        label={category}
        selected={value === category}
        onPress={() => onChange(value === category ? "" : category)}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingVertical: 4 },
});

export default CategoryPicker;
