import { useCallback, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AppModal from "../AppModal";
import Chip from "../Chip";
import { AppText, Badge } from "../ui";
import { useToast } from "../toast/ToastProvider";
import { addRecipeToMenu, selectMenuWeek } from "../../store/menuSlice";
import { todayIndex } from "../../domain/week";
import { makeStyles, radius, spacing, useTheme } from "../../theme";

// "Add to menu" picker: one tap puts the recipe on a day, into one of that day's meal
// slots, or in Unplanned ("Not sure yet").
const AddToMenuSheet = ({ visible, recipe: recipeProp, onClose, onAdd }) => {
  const theme = useTheme();
  const styles = useStyles();
  const week = useSelector(selectMenuWeek);
  // Keep the last recipe while the sheet fades out (same pattern as EntryOptionsModal).
  const last = useRef(recipeProp);
  if (recipeProp) last.current = recipeProp;
  const recipe = last.current;
  const today = todayIndex();
  if (!recipe) return null;
  return (
    <AppModal visible={visible && !!recipeProp} onClose={onClose} title="Add to menu" subtitle={recipe.name}>
      <Pressable
        style={({ pressed, hovered }) => [styles.row, styles.unplanned, (pressed || hovered) && styles.rowPressed]}
        onPress={() => onAdd({ day: null, slotId: null, label: "Unplanned" })}
        accessibilityRole="button"
        accessibilityLabel="Not sure yet. Add to Unplanned"
      >
        <Ionicons name="time-outline" size={20} color={theme.colors.textMuted} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Not sure yet</AppText>
          <AppText variant="small" tone="muted">Goes to Unplanned. Pick a day later.</AppText>
        </View>
      </Pressable>
      {week.map((day) => {
        // Each target shows its own count: the day row counts recipes on the day with no
        // meal; each meal chip counts the recipes in that meal.
        const n = day.entries.length;
        const hasSlots = day.slots.length > 0;
        return (
          <View key={day.day} style={styles.day}>
            <Pressable
              style={({ pressed, hovered }) => [styles.row, (pressed || hovered) && styles.rowPressed]}
              onPress={() => onAdd({ day: day.day, slotId: null, label: day.label })}
              accessibilityRole="button"
              accessibilityLabel={`Add to ${day.label}`}
            >
              <View style={styles.dayLabel}>
                <AppText variant="bodyStrong">{day.label}</AppText>
                {day.day === today ? <Badge label="Today" tone="primary" /> : null}
              </View>
              {n > 0 ? (
                <AppText variant="small" tone="muted">{hasSlots ? `${n} no meal` : `${n} planned`}</AppText>
              ) : null}
              <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
            </Pressable>
            {hasSlots ? (
              <View style={styles.slots}>
                {day.slots.map((slot) => (
                  <Chip
                    key={slot.id}
                    size="sm"
                    label={slot.name}
                    count={slot.entries.length}
                    accessibilityLabel={`Add to ${day.label} ${slot.name}${
                      slot.entries.length ? `, ${slot.entries.length} planned` : ""
                    }`}
                    onPress={() => onAdd({ day: null, slotId: slot.id, label: `${day.label} · ${slot.name}` })}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </AppModal>
  );
};

// Screen-level helper: `openAddToMenu(recipe)` shows the sheet; render `addToMenuSheet`.
export function useAddToMenu() {
  const dispatch = useDispatch();
  const toast = useToast();
  const navigation = useNavigation();
  const [recipe, setRecipe] = useState(null);
  const close = useCallback(() => setRecipe(null), []);
  const add = ({ day, slotId, label }) => {
    if (!recipe) return;
    dispatch(addRecipeToMenu({ recipeId: recipe.id, day, slotId }));
    close();
    toast.show(`Added to ${label}`, { actionLabel: "View menu", onAction: () => navigation.navigate("Menu") });
  };
  const addToMenuSheet = <AddToMenuSheet visible={!!recipe} recipe={recipe} onClose={close} onAdd={add} />;
  return { openAddToMenu: setRecipe, addToMenuSheet };
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  rowPressed: { backgroundColor: t.colors.surfaceAlt },
  unplanned: { marginBottom: spacing.sm, paddingVertical: spacing.sm, backgroundColor: t.colors.background },
  day: { borderTopWidth: 1, borderTopColor: t.colors.border, paddingVertical: spacing.xs },
  dayLabel: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
}));

export default AddToMenuSheet;
