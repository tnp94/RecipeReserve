import { ScrollView, Switch, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useDialog } from "../components/dialog/DialogProvider";
import { AppText, Card, Divider, ListRow } from "../components/ui";
import useLayout from "../hooks/useLayout";
import { makeStyles, spacing, useTheme } from "../theme";
import {
  selectHideGettingStarted,
  selectHideMenuTip,
  selectShowStapleReminder,
  setHideGettingStarted,
  setHideMenuTip,
  setShowStapleReminder,
} from "../store/settingsSlice";
import { selectStaplesList } from "../store/pantrySlice";
import { loadRecipeList, resetAllPlanHistory } from "../store/recipesSlice";
import { clearMenu } from "../store/menuSlice";
import { clearShoppingList } from "../store/shoppingListSlice";

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const dialog = useDialog();
  const theme = useTheme();
  const styles = useStyles();
  const { isWide } = useLayout();
  const showReminder = useSelector(selectShowStapleReminder);
  const hideMenuTip = useSelector(selectHideMenuTip);
  const hideGettingStarted = useSelector(selectHideGettingStarted);
  const stapleCount = useSelector(selectStaplesList).length;

  const confirm = (title, message, actionText, action) => {
    dialog.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: actionText, style: "destructive", onPress: () => dispatch(action()) },
    ]);
  };

  const toggle = (value, onChange, label) => (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
      thumbColor={theme.colors.surface}
      activeThumbColor={theme.colors.surface}
      ios_backgroundColor={theme.colors.borderStrong}
    />
  );

  const section = (title, children) => (
    <View style={styles.section}>
      <AppText variant="overline" tone="muted" style={styles.sectionTitle}>{title}</AppText>
      <Card padded="none" style={styles.card}>{children}</Card>
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
      {section(
        "Pantry",
        <ListRow
          icon="file-tray-stacked-outline"
          title="Pantry staples"
          subtitle={stapleCount === 0 ? "Things you always have, like salt and oil" : `${stapleCount} item${stapleCount === 1 ? "" : "s"}`}
          onPress={() => navigation.navigate("Pantry Staples")}
        />
      )}
      {section(
        "Reminders and tips",
        <>
          <ListRow
            icon="notifications-outline"
            title="Pantry staple reminder"
            subtitle="After generating a list, remind me to check staples I already have"
            right={toggle(showReminder, (v) => dispatch(setShowStapleReminder(v)), "Pantry staple reminder")}
          />
          <Divider inset={64} />
          <ListRow
            icon="bulb-outline"
            title="Menu tip"
            subtitle="Show how to move and swap meals"
            right={toggle(!hideMenuTip, (v) => dispatch(setHideMenuTip(!v)), "Show menu tip")}
          />
          <Divider inset={64} />
          <ListRow
            icon="flag-outline"
            title="Getting started guide"
            subtitle="Show the setup steps on Home"
            right={toggle(!hideGettingStarted, (v) => dispatch(setHideGettingStarted(!v)), "Show getting started guide")}
          />
        </>
      )}
      {section(
        "Data",
        <>
          <ListRow
            icon="cart-outline"
            title="Clear shopping list"
            destructive
            onPress={() => confirm("Clear shopping list?", "All items will be removed.", "Clear", clearShoppingList)}
          />
          <Divider inset={64} />
          <ListRow
            icon="calendar-outline"
            title="Clear menu"
            destructive
            onPress={() => confirm("Clear menu?", "All planned recipes and meal slots will be removed.", "Clear", clearMenu)}
          />
          <Divider inset={64} />
          <ListRow
            icon="repeat-outline"
            title="Reset planning history"
            subtitle="How often and when each recipe was planned"
            destructive
            onPress={() =>
              confirm(
                "Reset planning history?",
                "Every recipe will count as never planned, for the Most planned and Recently planned sorts. Your menu won't change.",
                "Reset",
                resetAllPlanHistory
              )
            }
          />
          <Divider inset={64} />
          <ListRow
            icon="refresh-outline"
            title="Reset recipes to samples"
            destructive
            onPress={() => confirm("Reset recipes to samples?", "Your own recipes will be deleted. This can't be undone.", "Reset", loadRecipeList)}
          />
        </>
      )}
      <AppText variant="caption" tone="subtle" align="center" style={styles.footer}>
        RecipeReserve · Your data stays on this device.
      </AppText>
    </ScrollView>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  contentWide: { width: "100%", maxWidth: 720, alignSelf: "center" },
  section: { marginBottom: spacing.xl },
  sectionTitle: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  card: { overflow: "hidden" },
  footer: { marginTop: spacing.sm },
}));

export default SettingsScreen;
