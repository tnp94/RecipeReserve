import { View, Text, TouchableOpacity, Button } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { selectRecipeById, toggleFavorite } from "../store/recipesSlice";
import { addRecipeToMenu } from "../store/menuSlice";
import { selectIsStaple, toggleStaple } from "../store/pantrySlice";
import { useDialog } from "../components/dialog/DialogProvider";
import Chip from "../components/Chip";
import useLayout from "../hooks/useLayout";
import { colors } from "../theme";

const IngredientRow = ({ ingredient }) => {
  const dispatch = useDispatch();
  const isStaple = useSelector((state) => selectIsStaple(state, ingredient.name));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 3, gap: 8 }}>
      <Text style={{ flex: 1 }}>
        {ingredient.quantityUnit} {ingredient.unit} {ingredient.name} {ingredient.note ? `(${ingredient.note})` : ""}
      </Text>
      <Chip
        label="Staple"
        selected={isStaple}
        onPress={() => dispatch(toggleStaple(ingredient.name))}
        style={{ minHeight: 26, paddingHorizontal: 8 }}
      />
    </View>
  );
};

const RecipeDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const dialog = useDialog();
  const { isWide } = useLayout();
  const { recipeId } = route.params;
  const recipe = useSelector((state) => selectRecipeById(state, recipeId));

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={recipe?.favorite ? "Remove from favorites" : "Add to favorites"}
            onPress={() => dispatch(toggleFavorite(recipeId))}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 26, color: recipe?.favorite ? colors.favorite : colors.muted }}>
              {recipe?.favorite ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
          <Button onPress={() => navigation.navigate("Recipe Form", { recipeId })} title="Edit" />
        </View>
      ),
    });
  }, [recipeId, recipe?.favorite]);

  if (!recipe) return null;

  const addToMenu = () => {
    dispatch(addRecipeToMenu({ recipeId }));
    dialog.alert("Added to menu", "Find it under Unplanned on the Menu tab.");
  };

  const ingredientsSection = (
    <View style={{ marginBottom: 12, flex: isWide ? 1 : undefined }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", paddingHorizontal: 5 }}>Ingredients</Text>
      {recipe.ingredients.map((ingredient, index) => (
        <IngredientRow key={ingredient.name + index.toString()} ingredient={ingredient} />
      ))}
    </View>
  );
  const directionsSection = (
    <View style={{ marginBottom: 12, flex: isWide ? 1 : undefined }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", paddingHorizontal: 5 }}>Directions</Text>
      {recipe.directions.map((step, index) => (
        <Text style={{ paddingHorizontal: 10, marginBottom: 5 }} key={index}>
          <Text style={{ fontWeight: "bold" }}>{index + 1}.</Text> {step}
        </Text>
      ))}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={isWide ? { maxWidth: 1100, width: "100%", alignSelf: "center" } : undefined}>
      <Text style={{ fontSize: 36, textAlign: "center", fontWeight: "bold" }}>{recipe.name}</Text>
      <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 8 }}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={addToMenu}
          style={{ backgroundColor: "skyblue", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 7 }}
        >
          <Text>Add to menu</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ textAlign: "center", fontSize: 12 }}>
        Prep Time: {Number(recipe.time?.prep) ? recipe.time.prep + " minutes" : "?"}
      </Text>
      <Text style={{ textAlign: "center", fontSize: 12 }}>
        Active Time: {Number(recipe.time?.active) ? recipe.time.active + " minutes" : "?"}
      </Text>
      {recipe.yield > 0 && <Text style={{ textAlign: "center", fontSize: 12 }}>Serves {recipe.yield}</Text>}
      {recipe.calories > 0 && <Text style={{ textAlign: "center", fontSize: 12 }}>{recipe.calories} calories</Text>}
      <Text style={{ textAlign: "center", marginBottom: 12, fontSize: 12 }}>
        {recipe.difficulty !== "" && "Difficulty: " + recipe.difficulty}
      </Text>
      {isWide ? (
        <View style={{ flexDirection: "row", gap: 16 }}>
          {ingredientsSection}
          {directionsSection}
        </View>
      ) : (
        <>
          {ingredientsSection}
          {directionsSection}
        </>
      )}
    </ScrollView>
  );
};

export default RecipeDetailsScreen;
