import { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import Chip from "../components/Chip";
import { useDialog } from "../components/dialog/DialogProvider";
import useLayout from "../hooks/useLayout";
import { colors, spacing, radius } from "../theme";
import { findRecipes } from "../domain/recipeFinder";
import { selectAllRecipes } from "../store/recipesSlice";
import { selectStaplesList } from "../store/pantrySlice";
import {
  addFinderIngredients,
  removeFinderIngredient,
  setFinderIngredientTag,
  clearFinderIngredients,
  selectFinderIngredients,
} from "../store/finderSlice";
import { addItemsToShoppingList } from "../store/thunks";

const ResultCard = ({ result, onOpen, onAddMissing }) => {
  const { recipe, matchedCount, totalCount, missing, expiringCount, isFullMatch } = result;
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onOpen} style={styles.card}>
      <Text style={styles.cardTitle}>{recipe.name}</Text>
      <Text style={styles.cardText}>
        Have {matchedCount} of {totalCount} ingredients
      </Text>
      {expiringCount > 0 && (
        <Text style={styles.cardText}>
          Uses {expiringCount} expiring {expiringCount === 1 ? "item" : "items"}
        </Text>
      )}
      {!isFullMatch && (
        <>
          <Text style={styles.cardText}>Missing: {missing.map((m) => m.name).join(", ")}</Text>
          <Chip label="Add missing to shopping list" onPress={onAddMissing} style={{ alignSelf: "flex-start", marginTop: spacing.sm }} />
        </>
      )}
    </TouchableOpacity>
  );
};

const RecipeFinderScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const dialog = useDialog();
  const { isWide } = useLayout();
  const [text, setText] = useState("");
  const recipes = useSelector(selectAllRecipes);
  const ingredients = useSelector(selectFinderIngredients);
  const staples = useSelector(selectStaplesList);
  const { fullMatches, nearMatches } = useMemo(() => findRecipes(recipes, ingredients), [recipes, ingredients]);

  const submit = () => {
    const names = text.split(",").map((s) => s.trim()).filter(Boolean);
    if (names.length > 0) dispatch(addFinderIngredients(names));
    setText("");
  };

  const toggleTag = (item, tag) => {
    dispatch(setFinderIngredientTag({ id: item.id, tag: item.tag === tag ? null : tag }));
  };

  const addMissing = (missing) => {
    const n = dispatch(addItemsToShoppingList(missing));
    dialog.alert("Added to shopping list", `${n} ${n === 1 ? "item" : "items"} added.`);
  };

  const openRecipe = (recipeId) => navigation.navigate("Recipe Details", { recipeId });

  const renderGroup = (title, results) =>
    results.length > 0 && (
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {results.map((r) => (
          <ResultCard
            key={r.recipe.id}
            result={r}
            onOpen={() => openRecipe(r.recipe.id)}
            onAddMissing={() => addMissing(r.missing)}
          />
        ))}
      </View>
    );

  const hasResults = fullMatches.length > 0 || nearMatches.length > 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, isWide && { maxWidth: 800, width: "100%", alignSelf: "center" }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Add an ingredient you have"
          blurOnSubmit={false}
          onSubmitEditing={submit}
        />
        <Chip label="Add" onPress={submit} />
      </View>
      <View style={styles.toolbar}>
        <Chip
          label="Add pantry staples"
          disabled={staples.length === 0}
          onPress={() => dispatch(addFinderIngredients(staples.map((s) => s.name)))}
        />
        <Chip label="Clear all" disabled={ingredients.length === 0} onPress={() => dispatch(clearFinderIngredients())} />
      </View>
      <Text style={styles.hint}>
        Tap Expiring soon to prefer recipes that use it. Tap Must use to only show recipes that include it.
      </Text>

      {ingredients.map((item) => (
        <View key={item.id} style={styles.ingredientRow}>
          <View style={styles.ingredientHeader}>
            <Text style={styles.ingredientName}>{item.name}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name}`}
              onPress={() => dispatch(removeFinderIngredient(item.id))}
              style={styles.remove}
            >
              <Text style={{ fontSize: 18, color: colors.muted }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagRow}>
            <Chip label="Expiring soon" selected={item.tag === "expiring"} onPress={() => toggleTag(item, "expiring")} />
            <Chip label="Must use" selected={item.tag === "required"} onPress={() => toggleTag(item, "required")} />
          </View>
        </View>
      ))}

      {renderGroup("You can make", fullMatches)}
      {renderGroup("Almost there", nearMatches)}

      {ingredients.length === 0 && (
        <Text style={styles.empty}>Add ingredients you have on hand to see what you can make.</Text>
      )}
      {ingredients.length > 0 && !hasResults && (
        <Text style={styles.empty}>
          No recipes match yet. Try adding more ingredients or removing a Must use tag.
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  toolbar: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  hint: { color: colors.muted, fontSize: 13 },
  ingredientRow: { paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  ingredientHeader: { flexDirection: "row", alignItems: "center" },
  tagRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  ingredientName: { flex: 1, fontSize: 16, color: colors.text },
  remove: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginTop: spacing.md, marginBottom: spacing.sm, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontWeight: "bold", fontSize: 16, color: colors.text },
  cardText: { color: colors.text, marginTop: 2 },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
});

export default RecipeFinderScreen;
