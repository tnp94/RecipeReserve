import { Platform, Pressable, ScrollView, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { selectAllRecipes } from "../store/recipesSlice";
import { selectMenuEntryCount, selectMenuWeek, selectUnplannedEntries } from "../store/menuSlice";
import { selectShoppingItems } from "../store/shoppingListSlice";
import { selectHideGettingStarted, setHideGettingStarted } from "../store/settingsSlice";
import { recipeList as seedRecipes } from "../Recipes";
import { AppText, Button, Card, IconButton, ProgressBar, RecipeThumb } from "../components/ui";
import useLayout from "../hooks/useLayout";
import useGenerateList from "../hooks/useGenerateList";
import { SHORT_DAYS, todayIndex } from "../domain/week";
import { plural } from "../domain/format";
import { makeStyles, radius, spacing, useTheme } from "../theme";

const SEED_IDS = new Set(seedRecipes.map((r) => r.id));

function greeting(date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const dayCount = (day) => day.entries.length + day.slots.reduce((n, s) => n + s.entries.length, 0);

// ---------- pieces ----------

const Step = ({ done, title, actionLabel, onAction, last }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.step, !last && styles.stepDivider]}>
      <View style={[styles.stepCheck, done && styles.stepCheckDone]}>
        {done ? <Ionicons name="checkmark" size={14} color={theme.colors.onPrimary} /> : null}
      </View>
      <AppText variant="body" style={[styles.flex, done && { color: theme.colors.textSubtle, textDecorationLine: "line-through" }]}>
        {title}
      </AppText>
      {!done ? <Button label={actionLabel} size="sm" variant="tonal" onPress={onAction} /> : null}
    </View>
  );
};

const QuickAction = ({ icon, label, onPress }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }) => [styles.quick, (pressed || hovered) && styles.quickPressed]}
    >
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={20} color={theme.colors.primary} />
      </View>
      <AppText variant="smallStrong" align="center" numberOfLines={2}>{label}</AppText>
    </Pressable>
  );
};

const MealRow = ({ entry, label, onPress }) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${entry.recipe.name}`}
      style={({ pressed, hovered }) => [styles.meal, (pressed || hovered) && styles.mealPressed]}
    >
      <RecipeThumb recipe={entry.recipe} size={44} rounded={radius.md} />
      <View style={styles.flex}>
        <AppText variant="overline" tone="muted">{label}</AppText>
        <AppText variant="bodyStrong" numberOfLines={1}>{entry.recipe.name}</AppText>
      </View>
      {entry.scale !== 1 ? <AppText variant="small" tone="muted">{`×${entry.scale}`}</AppText> : null}
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSubtle} />
    </Pressable>
  );
};

// ---------- screen ----------

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const recipes = useSelector(selectAllRecipes);
  const week = useSelector(selectMenuWeek);
  const unplanned = useSelector(selectUnplannedEntries);
  const entryCount = useSelector(selectMenuEntryCount);
  const items = useSelector(selectShoppingItems);
  const hideGettingStarted = useSelector(selectHideGettingStarted);
  const { onGenerate, reminderModal } = useGenerateList(navigation);

  const now = new Date();
  const today = todayIndex(now);
  const todayPlan = week[today];
  const todayMeals = [
    ...todayPlan.slots.flatMap((slot) => slot.entries.map((entry) => ({ entry, label: slot.name }))),
    ...todayPlan.entries.map((entry) => ({ entry, label: "Any time" })),
  ];
  const checked = items.filter((i) => i.checked).length;

  const openRecipe = (recipeId) =>
    navigation.navigate("RecipeList", { screen: "Recipe Details", params: { recipeId }, initial: false });
  const newRecipe = () => navigation.navigate("RecipeList", { screen: "Recipe Form", initial: false });
  const finder = () => navigation.navigate("RecipeList", { screen: "Recipe Finder", initial: false });
  const browse = () => navigation.navigate("RecipeList", { screen: "My Recipes" });
  const menu = () => navigation.navigate("Menu");
  const list = () => navigation.navigate("ShoppingList");

  const steps = [
    { done: recipes.some((r) => !SEED_IDS.has(r.id)), title: "Add one of your own recipes", actionLabel: "Add", onAction: newRecipe },
    { done: entryCount > 0, title: "Plan a few meals for the week", actionLabel: "Browse", onAction: browse },
    { done: items.length > 0, title: "Generate your shopping list", actionLabel: "Generate", onAction: onGenerate },
  ];
  const showSteps = !hideGettingStarted && steps.some((s) => !s.done);

  const gettingStarted = showSteps ? (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <AppText variant="heading">Get started</AppText>
          <AppText variant="small" tone="muted">Three steps from recipes to a shopping list.</AppText>
        </View>
        <IconButton icon="close" size={18} accessibilityLabel="Hide getting started" onPress={() => dispatch(setHideGettingStarted(true))} />
      </View>
      {steps.map((s, i) => <Step key={s.title} {...s} last={i === steps.length - 1} />)}
    </Card>
  ) : null;

  const todayCard = (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <AppText variant="overline" tone="primary">Today</AppText>
          <AppText variant="heading">{todayPlan.label}</AppText>
        </View>
        <Button label="Menu" iconRight="chevron-forward" variant="ghost" size="sm" onPress={menu} />
      </View>
      {todayMeals.length === 0 ? (
        <View style={styles.emptyToday}>
          <AppText tone="muted">Nothing planned for today.</AppText>
          <Button label="Plan a meal" icon="add" variant="tonal" size="sm" onPress={browse} style={styles.alignStart} />
        </View>
      ) : (
        todayMeals.map(({ entry, label }) => (
          <MealRow key={entry.id} entry={entry} label={label} onPress={() => openRecipe(entry.recipeId)} />
        ))
      )}
    </Card>
  );

  const weekCard = (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <AppText variant="heading">This week</AppText>
          <AppText variant="small" tone="muted">
            {entryCount === 0
              ? "No meals planned yet"
              : `${plural(entryCount, "meal")} planned${unplanned.length ? ` · ${unplanned.length} without a day` : ""}`}
          </AppText>
        </View>
      </View>
      <View style={styles.weekStrip}>
        {week.map((day) => {
          const n = dayCount(day);
          const isToday = day.day === today;
          return (
            <Pressable
              key={day.day}
              onPress={menu}
              accessibilityRole="button"
              accessibilityLabel={`${day.label}: ${n === 0 ? "nothing planned" : plural(n, "meal")}`}
              style={[styles.weekDay, isToday && styles.weekDayToday]}
            >
              <AppText variant="caption" style={{ color: isToday ? theme.colors.onPrimary : theme.colors.textMuted, fontWeight: "600" }}>
                {SHORT_DAYS[day.day]}
              </AppText>
              <AppText variant="subheading" style={{ color: isToday ? theme.colors.onPrimary : n ? theme.colors.text : theme.colors.textSubtle }}>
                {n || "–"}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );

  const shoppingCard = (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="cart-outline" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">Shopping list</AppText>
          <AppText variant="small" tone="muted">
            {items.length === 0
              ? entryCount > 0
                ? "Ready when you are."
                : "Empty for now."
              : checked === items.length
                ? "Everything's checked off."
                : `${plural(items.length - checked, "item")} to buy`}
          </AppText>
        </View>
      </View>
      {items.length > 0 ? (
        <>
          <ProgressBar value={checked / items.length} accessibilityLabel="Shopping progress" style={styles.progress} />
          <Button label="Open list" iconRight="arrow-forward" variant="secondary" onPress={list} />
        </>
      ) : entryCount > 0 ? (
        <Button label="Generate list from menu" icon="flash-outline" onPress={onGenerate} />
      ) : (
        <Button label="Open list" variant="secondary" onPress={list} />
      )}
    </Card>
  );

  const quickActions = (
    <View style={styles.quickRow}>
      <QuickAction icon="add-circle-outline" label="New recipe" onPress={newRecipe} />
      <QuickAction icon="sparkles-outline" label="What can I make?" onPress={finder} />
      <QuickAction icon="book-outline" label="All recipes" onPress={browse} />
    </View>
  );

  const dateText = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }, isWide && styles.contentWide]}>
        <View style={styles.hero}>
          <AppText variant="overline" tone="primary">RecipeReserve</AppText>
          <AppText variant="display" accessibilityRole="header">{greeting(now)}</AppText>
          <AppText variant="body" tone="muted">{dateText}</AppText>
        </View>
        {gettingStarted}
        {isWide ? (
          <View style={styles.columns}>
            <View style={styles.flex}>
              {todayCard}
              {weekCard}
            </View>
            <View style={styles.flex}>
              {shoppingCard}
              {quickActions}
            </View>
          </View>
        ) : (
          <>
            {todayCard}
            {shoppingCard}
            {weekCard}
            {quickActions}
          </>
        )}
      </ScrollView>
      {reminderModal}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1, minWidth: 0 },
  alignStart: { alignSelf: "flex-start" },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  contentWide: { maxWidth: 1100, width: "100%", alignSelf: "center", paddingHorizontal: spacing.xl },
  hero: { marginBottom: spacing.lg, gap: 2 },
  columns: { flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" },
  card: { marginBottom: spacing.lg, gap: spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xs },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: t.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: { marginBottom: spacing.sm },
  step: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 52 },
  stepDivider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  stepCheck: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: t.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCheckDone: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  emptyToday: { gap: spacing.md, paddingVertical: spacing.xs },
  meal: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  mealPressed: { backgroundColor: t.colors.surfaceAlt },
  weekStrip: { flexDirection: "row", gap: spacing.xs },
  weekDay: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: t.colors.background,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  weekDayToday: { backgroundColor: t.colors.primary },
  quickRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  quick: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  quickPressed: { backgroundColor: t.colors.surfaceAlt },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
}));

export default HomeScreen;
