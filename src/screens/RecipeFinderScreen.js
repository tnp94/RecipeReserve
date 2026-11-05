import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Chip from "../components/Chip";
import { useToast } from "../components/toast/ToastProvider";
import { useAddToMenu } from "../components/menu/AddToMenuSheet";
import { AppText, Badge, Button, Card, EmptyState, IconButton, ProgressBar, RecipeThumb, SectionHeader, TextField } from "../components/ui";
import useLayout from "../hooks/useLayout";
import { makeStyles, radius, spacing, useTheme } from "../theme";
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

const ResultCard = ({ result, onOpen, onAddMissing, onAddToMenu, partial }) => {
  const styles = useStyles();
  const { recipe, matchedCount, totalCount, missing, expiringCount, isFullMatch } = result;
  return (
    <Card onPress={onOpen} style={styles.card} accessibilityLabel={`${recipe.name}. Have ${matchedCount} of ${totalCount} ingredients`}>
      <View style={styles.cardTop}>
        <RecipeThumb recipe={recipe} size={56} rounded={radius.md} />
        <View style={styles.flex}>
          <AppText variant="subheading" numberOfLines={2}>{recipe.name}</AppText>
          <AppText variant="small" tone="muted">{`Have ${matchedCount} of ${totalCount} ingredients`}</AppText>
          <ProgressBar value={matchedCount / totalCount} style={styles.cardProgress} />
        </View>
      </View>
      {expiringCount > 0 || (!isFullMatch && partial) ? (
        <View style={styles.badges}>
          {expiringCount > 0 ? (
            <Badge tone="warning" icon="time-outline" label={`Uses ${expiringCount} expiring ${expiringCount === 1 ? "item" : "items"}`} />
          ) : null}
          {!isFullMatch && partial ? (
            <Badge tone="neutral" label={`Missing ${missing.length} ${missing.length === 1 ? "ingredient" : "ingredients"}`} />
          ) : null}
        </View>
      ) : null}
      {!isFullMatch && !partial ? (
        <AppText variant="small" style={styles.missing}>
          <AppText variant="smallStrong">Missing: </AppText>
          {missing.map((m) => m.name).join(", ")}
        </AppText>
      ) : null}
      <View style={styles.cardActions}>
        {!isFullMatch && !partial ? (
          <Button label="Add missing to list" icon="cart-outline" variant="tonal" size="sm" onPress={onAddMissing} />
        ) : null}
        <Button label="Add to menu" icon="calendar-outline" variant="ghost" size="sm" onPress={onAddToMenu} />
      </View>
    </Card>
  );
};

const RecipeFinderScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const toast = useToast();
  const theme = useTheme();
  const styles = useStyles();
  const { isWide } = useLayout();
  const { openAddToMenu, addToMenuSheet } = useAddToMenu();
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
    // Show every recent ingredient (typed or picked); ones already in the search are marked "Added".
    () => recent.slice(0, 8).map((name) => ({ name, added: currentKeys.has(normalizeName(name)) })),
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
    blurTimer.current = setTimeout(() => setFocused(false), 250);
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

  const addMissing = (missing, recipe) => {
    const { added, skipped } = dispatch(addItemsToShoppingList(missing, { id: recipe.id, name: recipe.name }));
    const items = (n) => `${n} ${n === 1 ? "item" : "items"}`;
    const parts = [];
    if (added > 0) parts.push(`${items(added)} added.`);
    if (skipped > 0) parts.push(`${items(skipped)} already on your list.`);
    toast.show(parts.join(" ") || "Nothing to add.", { actionLabel: "View list", onAction: () => navigation.navigate("ShoppingList") });
  };

  const openRecipe = (recipeId) => navigation.navigate("Recipe Details", { recipeId });

  const renderGroup = (title, subtitle, results, partial = false) =>
    results.length > 0 && (
      <View style={styles.group}>
        <SectionHeader title={title} subtitle={subtitle} />
        {results.map((r) => (
          <ResultCard
            key={r.recipe.id}
            result={r}
            onOpen={() => openRecipe(r.recipe.id)}
            onAddMissing={() => addMissing(r.missing, r.recipe)}
            onAddToMenu={() => openAddToMenu(r.recipe)}
            partial={partial}
          />
        ))}
      </View>
    );

  const hasResults = fullMatches.length > 0 || nearMatches.length > 0 || otherMatches.length > 0;

  const dropdown = (title, action, rows) => (
    <View style={styles.dropdown}>
      <View style={styles.dropdownHeader}>
        <AppText variant="overline" tone="muted" style={styles.flex}>{title}</AppText>
        {action}
      </View>
      {rows}
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.inputCard}>
          <AppText variant="heading">What do you have?</AppText>
          <AppText variant="small" tone="muted">
            Add ingredients you have on hand. Nothing to keep up to date: they're only used for this search.
          </AppText>
          <View style={styles.inputRow}>
            <TextField
              ref={inputRef}
              style={styles.flex}
              icon="add"
              onFocus={onFocus}
              onBlur={onBlur}
              value={text}
              onChangeText={setText}
              placeholder="e.g. chicken, spinach, rice"
              accessibilityLabel="Ingredient you have"
              blurOnSubmit={false}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
            <Button label="Add" onPress={submit} disabled={!text.trim()} />
          </View>
          {showRecent &&
            dropdown(
              "Recent",
              <Button label="Clear recent" variant="ghost" size="sm" onPress={() => dispatch(clearRecentFinderIngredients())} />,
              recentOptions.map(({ name, added }) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: added }}
                  disabled={added}
                  onPress={() => pick(name)}
                  style={({ pressed, hovered }) => [styles.dropdownRow, (pressed || hovered) && !added && styles.dropdownRowPressed]}
                >
                  <AppText variant="body" style={[styles.flex, added && { color: theme.colors.textSubtle }]}>{name}</AppText>
                  {added ? (
                    <View style={styles.added}>
                      <Ionicons name="checkmark" size={14} color={theme.colors.textSubtle} />
                      <AppText variant="caption" tone="subtle">Added</AppText>
                    </View>
                  ) : null}
                </Pressable>
              ))
            )}
          {showSuggestions &&
            dropdown(
              "From your recipes",
              null,
              suggestions.map((name) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  onPress={() => pick(name)}
                  style={({ pressed, hovered }) => [styles.dropdownRow, (pressed || hovered) && styles.dropdownRowPressed]}
                >
                  <AppText variant="body">{name}</AppText>
                </Pressable>
              ))
            )}
          <View style={styles.toolbar}>
            <Chip
              size="sm"
              icon="file-tray-stacked-outline"
              label="Add pantry staples"
              disabled={staples.length === 0}
              onPress={() => dispatch(addFinderIngredients({ names: staples.map((s) => s.name), remember: false }))}
            />
            <Chip size="sm" icon="close" label="Clear all" disabled={ingredients.length === 0} onPress={() => dispatch(clearFinderIngredients())} />
          </View>
        </Card>

        {ingredients.length > 0 ? (
          <Card padded="none" style={styles.ingredients}>
            <View style={styles.ingredientsHeader}>
              <AppText variant="subheading" style={styles.flex}>{`Your ingredients (${ingredients.length})`}</AppText>
            </View>
            <AppText variant="caption" tone="muted" style={styles.hint}>
              Expiring soon: prefer recipes that use it. Must use: only show recipes that include it.
            </AppText>
            {ingredients.map((item) => (
              <View key={item.id} style={styles.ingredientRow}>
                <AppText variant="bodyStrong" style={styles.ingredientName} numberOfLines={1}>{item.name}</AppText>
                <View style={styles.tagRow}>
                  <Chip
                    size="sm"
                    icon="time-outline"
                    label="Expiring soon"
                    selected={item.tag === "expiring"}
                    onPress={() => toggleTag(item, "expiring")}
                    accessibilityLabel={`${item.name}: expiring soon`}
                  />
                  <Chip
                    size="sm"
                    icon="lock-closed-outline"
                    label="Must use"
                    selected={item.tag === "required"}
                    onPress={() => toggleTag(item, "required")}
                    accessibilityLabel={`${item.name}: must use`}
                  />
                  <IconButton icon="close" size={18} accessibilityLabel={`Remove ${item.name}`} onPress={() => dispatch(removeFinderIngredient(item.id))} />
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        {renderGroup("You can make", "You have everything.", fullMatches)}
        {renderGroup("Almost there", "Missing one or two ingredients.", nearMatches)}
        {renderGroup("Uses some of your ingredients", null, otherMatches, true)}

        {ingredients.length === 0 ? (
          <EmptyState
            icon="sparkles-outline"
            title="Find something to cook"
            message="Add a few ingredients above and see which of your recipes you can make now."
          />
        ) : null}
        {ingredients.length > 0 && !hasResults ? (
          <EmptyState
            icon="search"
            title="No matches yet"
            message="Try adding more ingredients, or remove a Must use tag."
          />
        ) : null}
      </ScrollView>
      {addToMenuSheet}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  contentWide: { maxWidth: 800, width: "100%", alignSelf: "center" },
  inputCard: { gap: spacing.sm },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  dropdown: {
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: t.colors.surface,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.md,
    minHeight: 40,
    backgroundColor: t.colors.background,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  dropdownRowPressed: { backgroundColor: t.colors.surfaceAlt },
  added: { flexDirection: "row", alignItems: "center", gap: 2 },
  toolbar: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.xs },
  ingredients: { overflow: "hidden" },
  ingredientsHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  hint: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  ingredientName: { flexGrow: 1, flexShrink: 1, flexBasis: 120 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  group: { gap: spacing.sm },
  card: { gap: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardProgress: { marginTop: spacing.xs, height: 6 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  missing: { color: t.colors.text },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
}));

export default RecipeFinderScreen;
