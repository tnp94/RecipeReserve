import { View, Text, TouchableOpacity, FlatList, TextInput, Button, TouchableWithoutFeedback, Keyboard, ScrollView, KeyboardAvoidingView, Alert, Platform } from "react-native";
import { useEffect, useState } from "react";
import { ingredientTemplate } from "../Models/Ingredient";
import { useDispatch, useSelector } from "react-redux";
import { addRecipe, editRecipe, selectRecipeById } from "../store/recipesSlice";
import Separator from "../components/Separator";

const emptyRecipe = {
  id: 0,
  name: "",
  image: "",
  count: 0,
  ingredients: [],
  time: {},
  difficulty: "",
  calories: 0,
  favorite: false,
  dishesAmount: "",
  yield: 0,
  directions: [],
};

const RecipeFormScreen = ({ navigation, route }) => {
  const recipeId = route.params?.recipeId;
  const isEditing = !!recipeId;

  const existingRecipe = useSelector((state) => isEditing ? selectRecipeById(state, recipeId) : null);
  const dispatch = useDispatch();

  const [data, setData] = useState(isEditing ? { ...emptyRecipe, ...existingRecipe } : emptyRecipe);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={() => onSaveButtonPress(data)} title={isEditing ? "Save/copy" : "Save"} />
      ),
    });
  }, [data]);

  const onSaveButtonPress = (recipe) => {
    if (isEditing) {
      Alert.alert("Save edits", "Do you want to create this as a new recipe?", [
        {
          text: "Save edits",
          onPress: () => {
            dispatch(editRecipe({ id: recipeId, changes: recipe }));
            navigation.pop();
          },
        },
        {
          text: "Create as new recipe",
          onPress: () => {
            Alert.prompt(
              "New Recipe Name",
              "Please enter the new recipe name",
              (text) => {
                dispatch(addRecipe({ ...recipe, name: text }));
                navigation.popToTop();
              },
              undefined,
              recipe.name
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      dispatch(addRecipe(recipe));
      navigation.popToTop();
    }
  };

  const updateIngredient = (field, text, index) => {
    const ingredients = [...data.ingredients];
    ingredients[index] = {
      ...data.ingredients[index],
      [field]: field === "quantityUnit" ? text.toString() : text,
    };
    setData({ ...data, ingredients });
  };

  const updateDirection = (text, index) => {
    const directions = [...data.directions];
    directions[index] = text;
    setData({ ...data, directions });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView nestedScrollEnabled={true} style={{ padding: 5 }}>
          <Text style={{ fontSize: 32, alignSelf: "center", marginBottom: 10 }}>
            {isEditing ? "Edit Recipe" : "Let's add a new Recipe!"}
          </Text>

          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 24 }}>Recipe Name</Text>
            {isEditing ? (
              <Text
                style={{ backgroundColor: "#fff", padding: 5 }}
                onPress={() => Alert.alert("To alter the name, save it as a new recipe")}
              >
                {data.name}
              </Text>
            ) : (
              <TextInput
                style={{ backgroundColor: "#fff", padding: 5 }}
                placeholder="Recipe Name"
                value={data.name}
                onChangeText={(text) => setData({ ...data, name: text })}
              />
            )}
          </View>

          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 24 }}>Recipe difficulty</Text>
            <TextInput
              style={{ backgroundColor: "#fff", padding: 5 }}
              placeholder="Easy/Medium/Hard"
              value={data.difficulty}
              onChangeText={(text) => setData({ ...data, difficulty: text })}
            />
          </View>

          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 24 }}>Recipe Time</Text>
            <Text style={{ fontSize: 18 }}>Prep time (minutes)</Text>
            <TextInput
              inputMode="numeric"
              style={{ backgroundColor: "#fff", padding: 5 }}
              placeholder="20"
              value={data.time?.prep?.toString()}
              onChangeText={(text) => {
                if (/^\d+$/.test(text)) {
                  setData({ ...data, time: { ...data.time, prep: Number.parseFloat(text) } });
                } else if (text === "") {
                  setData({ ...data, time: { ...data.time, prep: "" } });
                }
              }}
            />
            <Text style={{ fontSize: 18 }}>Active time (minutes)</Text>
            <TextInput
              inputMode="numeric"
              style={{ backgroundColor: "#fff", padding: 5 }}
              placeholder="90"
              value={data.time?.active?.toString()}
              onChangeText={(text) => {
                if (/^\d+$/.test(text)) {
                  setData({ ...data, time: { ...data.time, active: Number.parseFloat(text) } });
                } else if (text === "") {
                  setData({ ...data, time: { ...data.time, active: "" } });
                }
              }}
            />
          </View>

          <View>
            <View>
              <View style={{ flexDirection: "row" }}>
                <Text>Ingredients</Text>
                <TouchableOpacity
                  style={{ backgroundColor: "skyblue", padding: 5, borderRadius: 7, flex: 1, justifyContent: "center" }}
                  onPress={() => {
                    if (Keyboard.isVisible()) {
                      Keyboard.dismiss();
                    } else {
                      setData({ ...data, ingredients: [...data.ingredients, ingredientTemplate()] });
                    }
                  }}
                >
                  <Text>New Ingredient</Text>
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              scrollEnabled={false}
              data={data.ingredients}
              ItemSeparatorComponent={Separator}
              renderItem={({ item, index }) => (
                <View style={{ flexDirection: "column", borderWidth: 1 }}>
                  <View style={{ flexDirection: "row" }}>
                    <TextInput
                      style={{ paddingHorizontal: 5, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" }}
                      placeholder="#"
                      value={item.quantityUnit.toString()}
                      onChangeText={(text) => updateIngredient("quantityUnit", text, index)}
                    />
                    <TextInput
                      style={{ paddingHorizontal: 5, backgroundColor: "#fff" }}
                      placeholder="Unit"
                      value={item.unit.toString()}
                      onChangeText={(text) => updateIngredient("unit", text, index)}
                    />
                    <TextInput
                      style={{ paddingHorizontal: 10, backgroundColor: "#fff", flex: 1 }}
                      placeholder="Ingredient Name"
                      value={item.name.toString()}
                      onChangeText={(text) => updateIngredient("name", text, index)}
                    />
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <TextInput
                      style={{ paddingHorizontal: 10, backgroundColor: "#fff", flex: 1 }}
                      placeholder="Note:Minced?/Softened?/Trimmed?"
                      value={item.note}
                      onChangeText={(text) => updateIngredient("note", text, index)}
                    />
                    <TextInput
                      style={{ paddingHorizontal: 10, backgroundColor: "#fff", flex: 1 }}
                      placeholder="Category"
                      value={item.category}
                      onChangeText={(text) => updateIngredient("category", text, index)}
                    />
                    <TouchableOpacity
                      style={{ backgroundColor: "#fff", padding: 5, borderRadius: 7, flex: 1, justifyContent: "center" }}
                      onPress={() => {
                        const ingredients = [...data.ingredients];
                        ingredients.splice(index, 1);
                        setData({ ...data, ingredients });
                      }}
                    >
                      <Text style={{ color: "red" }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>

          <View>
            <View>
              <View style={{ flexDirection: "row" }}>
                <Text>Directions</Text>
                <TouchableOpacity
                  style={{ backgroundColor: "skyblue", padding: 5, borderRadius: 7, flex: 1, justifyContent: "center" }}
                  onPress={() => {
                    if (Keyboard.isVisible()) {
                      Keyboard.dismiss();
                    } else {
                      setData({ ...data, directions: [...data.directions, ""] });
                    }
                  }}
                >
                  <Text>New Direction</Text>
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              scrollEnabled={false}
              data={data.directions}
              ItemSeparatorComponent={Separator}
              renderItem={({ item, index }) => (
                <View style={{ flexDirection: "row" }}>
                  <Text>{index + 1}</Text>
                  <TextInput
                    style={{ paddingHorizontal: 10, backgroundColor: "#fff", flex: 7 }}
                    placeholder="?"
                    value={item}
                    multiline={true}
                    onChangeText={(text) => updateDirection(text, index)}
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: "#fff", padding: 5, borderRadius: 7, flex: 1, justifyContent: "center" }}
                    onPress={() => {
                      const directions = [...data.directions];
                      directions.splice(index, 1);
                      setData({ ...data, directions });
                    }}
                  >
                    <Text style={{ color: "red" }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default RecipeFormScreen;
