import { useCallback, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AppModal from "../AppModal";
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
        // Every target lists what's already on it, so the user can see what's on deck
        // before adding. The day row holds recipes on the day with no meal.
        const hasSlots = day.slots.length > 0;
        const dayNames = namesOf(day.entries);
        return (
          <View key={day.day} style={styles.day}>
            <Pressable
              style={({ pressed, hovered }) => [styles.row, (pressed || hovered) && styles.rowPressed]}
              onPress={() => onAdd({ day: day.day, slotId: null, label: day.label })}
              accessibilityRole="button"
              accessibilityLabel={`Add to ${day.label}${dayNames ? `. Planned: ${dayNames}` : ""}`}
            >
              <View style={styles.flex}>
                <View style={styles.dayLabel}>
                  <AppText variant="bodyStrong">{day.label}</AppText>
                  {day.day === today ? <Badge label="Today" tone="primary" /> : null}
                </View>
                {dayNames ? (
                  <>
                    {hasSlots ? <AppText variant="caption" tone="muted">Unassigned</AppText> : null}
                    <PlannedNames entries={day.entries} />
                  </>
                ) : !hasSlots ? (
                  <AppText variant="small" tone="muted">Nothing planned</AppText>
                ) : null}
              </View>
              <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
            </Pressable>
            {day.slots.map((slot) => {
              const names = namesOf(slot.entries);
              return (
                <Pressable
                  key={slot.id}
                  style={({ pressed, hovered }) => [styles.row, styles.slotRow, (pressed || hovered) && styles.rowPressed]}
                  onPress={() => onAdd({ day: null, slotId: slot.id, label: `${day.label} · ${slot.name}` })}
                  accessibilityRole="button"
                  accessibilityLabel={`Add to ${day.label} ${slot.name}${names ? `. Planned: ${names}` : ""}`}
                >
                  <AppText variant="smallStrong" style={styles.slotName} numberOfLines={1}>{slot.name}</AppText>
                  {names ? (
                    <View style={styles.flex}>
                      <PlannedNames entries={slot.entries} />
                    </View>
                  ) : (
                    <AppText variant="small" tone="muted" style={[styles.flex, styles.empty]}>Empty</AppText>
                  )}
                  <Ionicons name="add" size={20} color={theme.colors.primary} style={styles.slotAdd} />
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </AppModal>
  );
};

const namesOf = (entries) => entries.map((entry) => entry.recipe.name).join(", ");

// One line per planned recipe; a long name is cut to one line.
const PlannedNames = ({ entries }) =>
  entries.map((entry) => (
    <AppText key={entry.id} variant="small" tone="muted" numberOfLines={1}>
      {entry.recipe.name}
    </AppText>
  ));

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
  slotRow: { minHeight: 40, paddingVertical: spacing.sm, marginLeft: spacing.md, gap: spacing.sm, alignItems: "flex-start" },
  slotAdd: { alignSelf: "center" },
  slotName: { width: 84 },
  empty: { fontStyle: "italic", opacity: 0.7 },
}));

export default AddToMenuSheet;
