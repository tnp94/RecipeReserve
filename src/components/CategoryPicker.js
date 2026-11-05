import { StyleSheet, View } from "react-native";
import Chip from "./Chip";
import { INGREDIENTCATEGORIES } from "../Models/Ingredient";
import { spacing } from "../theme";

export const CATEGORY_ICONS = {
  [INGREDIENTCATEGORIES.PRODUCE]: "leaf-outline",
  [INGREDIENTCATEGORIES.DAIRY]: "egg-outline",
  [INGREDIENTCATEGORIES.MEAT]: "fish-outline",
  [INGREDIENTCATEGORIES.BAKERY]: "pizza-outline",
  [INGREDIENTCATEGORIES.DELI]: "fast-food-outline",
  [INGREDIENTCATEGORIES.CANNED]: "cube-outline",
  [INGREDIENTCATEGORIES.BAKING]: "cafe-outline",
  [INGREDIENTCATEGORIES.FROZEN]: "snow-outline",
  [INGREDIENTCATEGORIES.UNCATEGORIZED]: "basket-outline",
};

// Tapping the selected category clears it (back to "no category").
const CategoryPicker = ({ value, onChange }) => (
  <View style={styles.row}>
    {Object.values(INGREDIENTCATEGORIES).map((category) => (
      <Chip
        key={category}
        label={category}
        icon={CATEGORY_ICONS[category]}
        selected={value === category}
        onPress={() => onChange(value === category ? "" : category)}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingVertical: spacing.xs },
});

export default CategoryPicker;
