import { useLayoutEffect } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { selectRecipeById, toggleFavorite } from "../store/recipesSlice";
import { selectIsStaple, toggleStaple } from "../store/pantrySlice";
import { useAddToMenu } from "../components/menu/AddToMenuSheet";
import Chip from "../components/Chip";
import { AppText, Button, Card, HeaderButton, HeaderButtons, IconButton, RecipeThumb } from "../components/ui";
import { formatAmount } from "../domain/quantity";
import { formatMinutes, totalMinutes } from "../domain/format";
import useLayout from "../hooks/useLayout";
import { makeStyles, radius, spacing, useTheme } from "../theme";

const IngredientRow = ({ ingredient, last }) => {
  const dispatch = useDispatch();
  const styles = useStyles();
  const isStaple = useSelector((state) => selectIsStaple(state, ingredient.name));
  const amount = formatAmount(ingredient.quantityUnit, ingredient.unit);
  return (
    <View style={[styles.ingredient, !last && styles.rowDivider]}>
      <View style={styles.flex}>
        <AppText variant="body">
          {amount ? <AppText variant="bodyStrong">{`${amount} `}</AppText> : null}
          {ingredient.name}
        </AppText>
        {ingredient.note ? <AppText variant="small" tone="muted">{ingredient.note}</AppText> : null}
      </View>
      <Chip
        size="sm"
        label="Staple"
        icon={isStaple ? "checkmark" : "add"}
        selected={isStaple}
        accessibilityLabel={isStaple ? `${ingredient.name} is a pantry staple. Tap to remove.` : `Mark ${ingredient.name} as a pantry staple`}
        onPress={() => dispatch(toggleStaple(ingredient.name))}
      />
    </View>
  );
};

const Fact = ({ icon, label, value }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <View>
        <AppText variant="caption" tone="muted">{label}</AppText>
        <AppText variant="smallStrong">{value}</AppText>
      </View>
    </View>
  );
};

const RecipeDetailsScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const styles = useStyles();
  const { isWide } = useLayout();
  const { recipeId } = route.params;
  const recipe = useSelector((state) => selectRecipeById(state, recipeId));
  const { openAddToMenu, addToMenuSheet } = useAddToMenu();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButtons>
          <IconButton
            icon={recipe?.favorite ? "star" : "star-outline"}
            tone={recipe?.favorite ? "accent" : "muted"}
            accessibilityLabel={recipe?.favorite ? "Remove from favorites" : "Add to favorites"}
            onPress={() => dispatch(toggleFavorite(recipeId))}
          />
          <HeaderButton label="Edit" icon="create-outline" onPress={() => navigation.navigate("Recipe Form", { recipeId })} />
        </HeaderButtons>
      ),
    });
  }, [navigation, recipeId, recipe?.favorite]);

  if (!recipe) return null;

  const ingredients = recipe.ingredients ?? [];
  const directions = (recipe.directions ?? []).filter((d) => String(d ?? "").trim());
  const facts = [
    totalMinutes(recipe) > 0 && { icon: "time-outline", label: "Total", value: formatMinutes(totalMinutes(recipe)) },
    Number(recipe.time?.prep) > 0 && { icon: "hourglass-outline", label: "Prep", value: formatMinutes(recipe.time.prep) },
    Number(recipe.time?.active) > 0 && { icon: "flame-outline", label: "Cook", value: formatMinutes(recipe.time.active) },
    recipe.difficulty && { icon: "speedometer-outline", label: "Difficulty", value: recipe.difficulty },
    recipe.yield > 0 && { icon: "people-outline", label: "Serves", value: String(recipe.yield) },
    recipe.calories > 0 && { icon: "nutrition-outline", label: "Calories", value: String(recipe.calories) },
  ].filter(Boolean);

  const ingredientsSection = (
    <Card style={isWide ? styles.column : styles.section}>
      <View style={styles.sectionTitle}>
        <AppText variant="heading" accessibilityRole="header">Ingredients</AppText>
        <AppText variant="small" tone="muted">{ingredients.length}</AppText>
      </View>
      {ingredients.length === 0 ? <AppText tone="muted">No ingredients yet.</AppText> : null}
      {ingredients.map((ingredient, index) => (
        <IngredientRow key={ingredient.name + index.toString()} ingredient={ingredient} last={index === ingredients.length - 1} />
      ))}
    </Card>
  );
  const directionsSection = (
    <Card style={isWide ? styles.column : styles.section}>
      <View style={styles.sectionTitle}>
        <AppText variant="heading" accessibilityRole="header">Directions</AppText>
      </View>
      {directions.length === 0 ? <AppText tone="muted">No directions yet.</AppText> : null}
      {directions.map((step, index) => (
        <View key={index} style={styles.step}>
          <View style={styles.stepNumber}>
            <AppText variant="smallStrong" style={styles.stepNumberText}>{index + 1}</AppText>
          </View>
          <AppText variant="body" style={styles.flex}>{step}</AppText>
        </View>
      ))}
    </Card>
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <RecipeThumb recipe={recipe} height={isWide ? 180 : 112} width={isWide ? 240 : "100%"} rounded={radius.lg} />
          <View style={[styles.heroText, isWide && styles.flex]}>
            <AppText variant="display" accessibilityRole="header">{recipe.name}</AppText>
            {facts.length > 0 ? (
              <View style={styles.facts}>
                {facts.map((f) => <Fact key={f.label} {...f} />)}
              </View>
            ) : null}
            <Button label="Add to menu" icon="calendar-outline" onPress={() => openAddToMenu(recipe)} style={styles.addButton} />
          </View>
        </View>
        {isWide ? (
          <View style={styles.columns}>
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
      {addToMenuSheet}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  contentWide: { maxWidth: 1100, width: "100%", alignSelf: "center" },
  hero: { gap: spacing.lg, marginBottom: spacing.lg },
  heroWide: { flexDirection: "row", alignItems: "flex-start" },
  heroText: { gap: spacing.md },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  addButton: { alignSelf: "flex-start" },
  columns: { flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" },
  column: { flex: 1 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: spacing.sm },
  ingredient: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm + 2 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  step: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: t.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
  },
  stepNumberText: { color: t.colors.onPrimarySoft },
}));

export default RecipeDetailsScreen;
