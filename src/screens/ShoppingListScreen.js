import { useLayoutEffect, useMemo, useState } from "react";
import { View, Text, SectionList, Pressable, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { selectShoppingItems } from "../store/shoppingListSlice";
import { INGREDIENTCATEGORIES } from "../Models/Ingredient";
import ShoppingItemRow from "../components/shopping/ShoppingItemRow";
import AddItemModal from "../components/shopping/AddItemModal";
import useLayout from "../hooks/useLayout";
import { colors, spacing } from "../theme";

const CATEGORIES = Object.values(INGREDIENTCATEGORIES);

const ShoppingListScreen = ({ navigation }) => {
  const shoppingList = useSelector(selectShoppingItems);
  const { isWide } = useLayout();
  const [adding, setAdding] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setAdding(true)} accessibilityRole="button" style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Add item</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const sections = useMemo(() => {
    return CATEGORIES
      .map((category) => {
        const data = shoppingList
          .filter((item) =>
            category === INGREDIENTCATEGORIES.UNCATEGORIZED
              ? item.category === INGREDIENTCATEGORIES.UNCATEGORIZED || !CATEGORIES.includes(item.category)
              : item.category === category
          )
          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        return { title: category, data };
      })
      .filter((section) => section.data.length > 0);
  }, [shoppingList]);

  return (
    <View style={styles.screen}>
      <View style={[styles.content, isWide && styles.contentWide]}>
        <SectionList
          sections={sections}
          renderItem={({ item }) => <ShoppingItemRow item={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Your shopping list is empty. Plan your menu and tap Generate list, or add an item.
            </Text>
          }
        />
      </View>
      <AddItemModal visible={adding} onClose={() => setAdding(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, width: "100%" },
  contentWide: { maxWidth: 720, alignSelf: "center" },
  headerButton: { paddingHorizontal: spacing.lg, minHeight: 44, justifyContent: "center" },
  headerButtonText: { color: colors.accentStrong, fontSize: 16 },
  sectionHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
  separator: { height: 1, backgroundColor: colors.border },
  empty: { padding: spacing.xl, textAlign: "center", color: colors.muted, fontSize: 16 },
});

export default ShoppingListScreen;
