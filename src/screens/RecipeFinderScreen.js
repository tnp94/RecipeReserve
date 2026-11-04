import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import Chip from "../components/Chip";
import { useDialog } from "../components/dialog/DialogProvider";
import useLayout from "../hooks/useLayout";
import { colors, spacing, radius } from "../theme";
import { findRecipes } from "../domain/recipeFinder";
import { collectIngredientNames, suggestIngredients } from "../domain/ingredientSuggestions";
import { normalizeName } from "../domain/ingredientKey";
import { selectAllRecipes } from "../store/recipesSlice";
import { selectStaplesList } from "../store/pantrySlice";
import {
  addFinderIngredients,
  removeFinderIngredient,
  setFinderIngredientTag,
  clearFinderIngredients,
  clearRecentFinderIngredients,
  selectFinderIngredients,
  selectRecentFinderIngredients,
} from "../store/finderSlice";
import { addItemsToShoppingList } from "../store/thunks";

const ResultCard = ({ result, onOpen, onAddMissing, partial }) => {
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
      {!isFullMatch && partial && (
        <Text style={styles.cardText}>
          Missing {missing.length} {missing.length === 1 ? "ingredient" : "ingredients"}
        </Text>
      )}
      {!isFullMatch && !partial && (
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
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const blurTimer = useRef(null);
  useEffect(() => () => clearTimeout(blurTimer.current), []);
  const recipes = useSelector(selectAllRecipes);
  const ingredients = useSelector(selectFinderIngredients);
  const staples = useSelector(selectStaplesList);
  const recent = useSelector(selectRecentFinderIngredients);
  const { fullMatches, nearMatches, otherMatches } = useMemo(() => findRecipes(recipes, ingredients), [recipes, ingredients]);
  const allNames = useMemo(() => collectIngredientNames(recipes), [recipes]);
  const currentKeys = useMemo(() => new Set(ingredients.map((i) => normalizeName(i.name))), [ingredients]);
  const suggestions = useMemo(
    () => (text.trim() ? suggestIngredients(allNames, text, { exclude: ingredients.map((i) => i.name) }) : []),
    [allNames, text, ingredients]
  );
  const recentOptions = useMemo(
    () => recent.filter((n) => !currentKeys.has(normalizeName(n))).slice(0, 8),
    [recent, currentKeys]
  );
  const showSuggestions = focused && text.trim() !== "" && suggestions.length > 0;
  const showRecent = focused && text.trim() === "" && recentOptions.length > 0;

  const onFocus = () => {
    clearTimeout(blurTimer.current);
    setFocused(true);
  };
  const onBlur = () => {
    clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setFocused(false), 150);
  };
  const pick = (name) => {
    dispatch(addFinderIngredients([name]));
    setText("");
    setFocused(true);
    inputRef.current?.focus?.();
  };

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

  const renderGroup = (title, results, partial = false) =>
    results.length > 0 && (
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {results.map((r) => (
          <ResultCard
            key={r.recipe.id}
            result={r}
            onOpen={() => openRecipe(r.recipe.id)}
            onAddMissing={() => addMissing(r.missing)}
            partial={partial}
          />
        ))}
      </View>
    );

  const hasResults = fullMatches.length > 0 || nearMatches.length > 0 || otherMatches.length > 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, isWide && { maxWidth: 800, width: "100%", alignSelf: "center" }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          onFocus={onFocus}
          onBlur={onBlur}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Add an ingredient you have"
          blurOnSubmit={false}
          onSubmitEditing={submit}
        />
        <Chip label="Add" onPress={submit} />
      </View>
      {showRecent && (
        <View style={styles.dropdown}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Recent</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => dispatch(clearRecentFinderIngredients())}
              style={styles.dropdownAction}
            >
              <Text style={styles.dropdownActionText}>Clear recent</Text>
            </TouchableOpacity>
          </View>
          {recentOptions.map((name) => (
            <TouchableOpacity key={name} accessibilityRole="button" onPress={() => pick(name)} style={styles.dropdownRow}>
              <Text style={styles.dropdownText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showSuggestions && (
        <View style={styles.dropdown}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>From your recipes</Text>
          </View>
          {suggestions.map((name) => (
            <TouchableOpacity key={name} accessibilityRole="button" onPress={() => pick(name)} style={styles.dropdownRow}>
              <Text style={styles.dropdownText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
      {renderGroup("Uses some of your ingredients", otherMatches, true)}

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
  dropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.md,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownTitle: { fontWeight: "bold", color: colors.muted, fontSize: 13 },
  dropdownAction: { minHeight: 44, paddingHorizontal: spacing.md, justifyContent: "center" },
  dropdownActionText: { color: colors.accentStrong, fontWeight: "bold" },
  dropdownRow: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownText: { fontSize: 16, color: colors.text },
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
