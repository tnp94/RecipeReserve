import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useDialog } from "../components/dialog/DialogProvider";
import useLayout from "../hooks/useLayout";
import { colors, radius, spacing } from "../theme";
import { selectShowStapleReminder, setShowStapleReminder } from "../store/settingsSlice";
import { selectStaplesList } from "../store/pantrySlice";
import { loadRecipeList } from "../store/recipesSlice";
import { clearMenu } from "../store/menuSlice";
import { clearShoppingList } from "../store/shoppingListSlice";

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const dialog = useDialog();
  const { isWide } = useLayout();
  const showReminder = useSelector(selectShowStapleReminder);
  const stapleCount = useSelector(selectStaplesList).length;

  const confirm = (title, message, actionText, action) => {
    dialog.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: actionText, style: "destructive", onPress: () => dispatch(action()) },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
      <Text style={styles.section}>Reminders</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowText}>Remind me to check pantry staples after generating a list</Text>
          <Switch
            value={showReminder}
            onValueChange={(v) => dispatch(setShowStapleReminder(v))}
            accessibilityLabel="Pantry staple reminder"
          />
        </View>
      </View>

      <Text style={styles.section}>Pantry</Text>
      <View style={styles.card}>
        <Pressable style={styles.row} onPress={() => navigation.navigate("Pantry Staples")} accessibilityRole="button">
          <Text style={styles.rowText}>Pantry staples ({stapleCount})</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Data</Text>
      <View style={styles.card}>
        <Pressable
          style={styles.row}
          accessibilityRole="button"
          onPress={() => confirm("Reset recipes to samples?", "Your own recipes will be deleted.", "Reset", loadRecipeList)}
        >
          <Text style={styles.danger}>Reset recipes to samples</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.row}
          accessibilityRole="button"
          onPress={() => confirm("Clear menu?", "All planned recipes and meal slots will be removed.", "Clear", clearMenu)}
        >
          <Text style={styles.danger}>Clear menu</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.row}
          accessibilityRole="button"
          onPress={() => confirm("Clear shopping list?", "All items will be removed.", "Clear", clearShoppingList)}
        >
          <Text style={styles.danger}>Clear shopping list</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  contentWide: { width: "100%", maxWidth: 720, alignSelf: "center" },
  section: { fontSize: 13, color: colors.muted, textTransform: "uppercase", marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    minHeight: 52, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md,
  },
  rowText: { flex: 1, fontSize: 16, color: colors.text },
  chevron: { fontSize: 22, color: colors.muted },
  danger: { fontSize: 16, color: colors.danger },
  divider: { height: 1, backgroundColor: colors.border },
});

export default SettingsScreen;
