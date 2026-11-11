import { useLayoutEffect, useMemo, useState } from "react";
import { View, SectionList } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { clearShoppingList, deleteCheckedItems, selectShoppingItems } from "../store/shoppingListSlice";
import { selectAllRecipes } from "../store/recipesSlice";
import { selectMenuEntryCount } from "../store/menuSlice";
import { INGREDIENTCATEGORIES } from "../Models/Ingredient";
import { buildCategoryMemory, guessCategory } from "../domain/categoryGuess";
import ShoppingItemRow from "../components/shopping/ShoppingItemRow";
import AddItemModal from "../components/shopping/AddItemModal";
import { CATEGORY_ICONS } from "../components/CategoryPicker";
import { useDialog } from "../components/dialog/DialogProvider";
import { AppText, Button, Card, EmptyState, HeaderButton, ProgressBar } from "../components/ui";
import useLayout from "../hooks/useLayout";
import useGenerateList from "../hooks/useGenerateList";
import { plural } from "../domain/format";
import { makeStyles, radius, spacing, useTheme } from "../theme";

const CATEGORIES = Object.values(INGREDIENTCATEGORIES);

const byName = (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase());

// The aisle an item is shown under: its own category if it has a valid one, otherwise a
// guess from its name (display only; the stored item is unchanged), otherwise "Other".
function aisleOf(item, memory) {
  if (CATEGORIES.includes(item.category)) return item.category;
  return guessCategory(item.name, memory) || INGREDIENTCATEGORIES.UNCATEGORIZED;
}

const ShoppingListScreen = ({ navigation }) => {
  const shoppingList = useSelector(selectShoppingItems);
  const recipes = useSelector(selectAllRecipes);
  const entryCount = useSelector(selectMenuEntryCount);
  const dispatch = useDispatch();
  const dialog = useDialog();
  const theme = useTheme();
  const styles = useStyles();
  const { isWide } = useLayout();
  const [adding, setAdding] = useState(false);
  const { onGenerate, reminderModal } = useGenerateList(navigation);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ marginRight: spacing.md }}>
          <HeaderButton label="Add item" icon="add" onPress={() => setAdding(true)} />
        </View>
      ),
    });
  }, [navigation]);

  const memory = useMemo(() => buildCategoryMemory(recipes), [recipes]);
  const sections = useMemo(() => {
    const groups = new Map(CATEGORIES.map((c) => [c, []]));
    shoppingList.forEach((item) => groups.get(aisleOf(item, memory)).push(item));
    return CATEGORIES.map((category) => {
      const items = groups.get(category);
      // Still to buy first (A-Z), then what's already in the cart (A-Z).
      const data = [...items.filter((i) => !i.checked).sort(byName), ...items.filter((i) => i.checked).sort(byName)];
      // One card per aisle: rows reorder inside it when checked, but the card's own
      // rounded/clipped styling never changes. (Restyling a row's borderRadius while it has
      // overflow: hidden left the row blank on Android after checking it off.)
      return { title: category, data: [{ key: category, items: data }], remaining: items.filter((i) => !i.checked).length };
    }).filter((section) => section.data.length > 0);
  }, [shoppingList, memory]);

  const total = shoppingList.length;
  const checked = shoppingList.filter((i) => i.checked).length;
  const allDone = total > 0 && checked === total;

  const clearChecked = () =>
    dialog.alert(`Remove ${plural(checked, "checked item")}?`, "They'll be taken off the list.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => dispatch(deleteCheckedItems()) },
    ]);
  const clearAll = () =>
    dialog.alert("Clear the whole list?", "Every item will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear list", style: "destructive", onPress: () => dispatch(clearShoppingList()) },
    ]);

  const summary =
    total === 0 ? null : (
      <Card style={styles.summary}>
        <View style={styles.summaryTop}>
          <View style={styles.flex}>
            <AppText variant="subheading">
              {allDone ? "All done!" : `${plural(total - checked, "item")} to go`}
            </AppText>
            <AppText variant="small" tone="muted">{`${checked} of ${total} checked off`}</AppText>
          </View>
          {allDone ? (
            <Button label="Clear list" icon="trash-outline" variant="secondary" size="sm" onPress={clearAll} />
          ) : checked > 0 ? (
            <Button label="Clear checked" variant="ghost" size="sm" onPress={clearChecked} />
          ) : null}
        </View>
        <ProgressBar value={total ? checked / total : 0} accessibilityLabel="Shopping progress" />
      </Card>
    );

  return (
    <View style={styles.screen}>
      <View style={[styles.content, isWide && styles.contentWide]}>
        <SectionList
          sections={sections}
          renderItem={({ item: card }) => (
            <View style={styles.card}>
              {card.items.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <ShoppingItemRow item={item} />
                </View>
              ))}
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Ionicons name={CATEGORY_ICONS[section.title] ?? "basket-outline"} size={16} color={theme.colors.textMuted} />
              <AppText variant="overline" tone="muted" style={styles.flex}>{section.title}</AppText>
              <AppText variant="caption" tone="subtle">
                {section.remaining === 0 ? "Done" : `${section.remaining} left`}
              </AppText>
            </View>
          )}
          keyExtractor={(card) => card.key}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={summary}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            entryCount > 0 ? (
              <EmptyState
                icon="cart-outline"
                title="Your list is empty"
                message={`You have ${plural(entryCount, "recipe")} on your menu. Turn them into a shopping list in one tap.`}
                actionLabel="Generate list"
                onAction={onGenerate}
                secondaryLabel="Add an item"
                onSecondary={() => setAdding(true)}
              />
            ) : (
              <EmptyState
                icon="cart-outline"
                title="Your list is empty"
                message="Plan a few meals on the Menu tab, then generate your list from it. Or add items yourself."
                actionLabel="Go to menu"
                onAction={() => navigation.navigate("Menu")}
                secondaryLabel="Add an item"
                onSecondary={() => setAdding(true)}
              />
            )
          }
        />
      </View>
      <AddItemModal visible={adding} onClose={() => setAdding(false)} />
      {reminderModal}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  content: { flex: 1, width: "100%" },
  contentWide: { maxWidth: 720, alignSelf: "center" },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  summary: { gap: spacing.md, marginTop: spacing.xs },
  summaryTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  card: {
    overflow: "hidden",
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: radius.lg,
  },
  divider: { height: 1, backgroundColor: t.colors.border, marginLeft: spacing.lg + 24 + spacing.md },
}));

export default ShoppingListScreen;
