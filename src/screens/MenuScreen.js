import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, Button, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";
import {
  addSlot,
  addSlotAndMoveEntry,
  clearMenu,
  clearMenuEntries,
  moveMenuEntry,
  moveMenuEntryToDay,
  moveSlot,
  removeMenuEntry,
  removeSlot,
  renameSlot,
  selectMenuEntryCount,
  selectMenuWeek,
  selectUnplannedEntries,
  setMenuEntryScale,
  swapDays,
  swapMenuEntries,
} from "../store/menuSlice";
import { generateShoppingList } from "../store/thunks";
import { selectShoppingItemCount } from "../store/shoppingListSlice";
import { selectShowStapleReminder, setShowStapleReminder } from "../store/settingsSlice";
import { useDialog } from "../components/dialog/DialogProvider";
import useLayout from "../hooks/useLayout";
import { colors, radius, spacing } from "../theme";
import DragProvider, { DragScrollView, dropOverStyle, useDragState } from "../components/menu/drag/DragProvider";
import useDropZone from "../components/menu/drag/useDropZone";
import MenuDay from "../components/menu/MenuDay";
import MenuEntryRow from "../components/menu/MenuEntryRow";
import EntryOptionsModal from "../components/menu/EntryOptionsModal";
import SlotPickerModal from "../components/menu/SlotPickerModal";
import EntryPickerModal from "../components/menu/EntryPickerModal";
import DayPickerModal from "../components/menu/DayPickerModal";
import StapleReminderModal from "../components/menu/StapleReminderModal";

// activeModal: null | { type: "entry"|"slotPicker"|"entryPicker", entryId }
//   | { type: "daySwap", day } | { type: "slotDay", slotId } | { type: "reminder", items }
const UnplannedSection = ({ entries, onEntryPress, onEntryRemove }) => {
  const dispatch = useDispatch();
  const { ref, isOver } = useDropZone({
    key: "unplanned",
    accepts: ["entry"],
    onDrop: (p) => {
      if (!entries.some((e) => e.id === p.id)) dispatch(moveMenuEntry({ entryId: p.id, slotId: null }));
    },
  });
  return (
    <View ref={ref} collapsable={false} style={[styles.unplanned, dropOverStyle(isOver)]}>
      <View style={styles.unplannedHeader}>
        <Text style={styles.unplannedTitle}>Unplanned</Text>
      </View>
      {entries.length === 0 ? (
        <Text style={styles.hint}>Recipes you add land here. Tap one to plan it.</Text>
      ) : (
        entries.map((entry) => (
          <MenuEntryRow key={entry.id} entry={entry} onPress={() => onEntryPress(entry)} onRemove={() => onEntryRemove(entry)} />
        ))
      )}
    </View>
  );
};

// Vertical column scroller (wide layout) locked while dragging.
const ColumnScroll = ({ children, style, contentContainerStyle }) => {
  const { active } = useDragState();
  return (
    <ScrollView style={style} contentContainerStyle={contentContainerStyle} scrollEnabled={!active}>
      {children}
    </ScrollView>
  );
};

const MenuScreen = ({ navigation }) => {
  const unplanned = useSelector(selectUnplannedEntries);
  const week = useSelector(selectMenuWeek);
  const entryCount = useSelector(selectMenuEntryCount);
  const itemCount = useSelector(selectShoppingItemCount);
  const showReminder = useSelector(selectShowStapleReminder);
  const dispatch = useDispatch();
  const dialog = useDialog();
  const { width, isWide } = useLayout();
  const [activeModal, setActiveModal] = useState(null);

  const slotCount = week.reduce((n, d) => n + d.slots.length, 0);
  const close = () => setActiveModal(null);

  const entryById = useMemo(() => {
    const map = {};
    unplanned.forEach((e) => (map[e.id] = e));
    week.forEach((d) => {
      d.entries.forEach((e) => (map[e.id] = e));
      d.slots.forEach((s) => s.entries.forEach((e) => (map[e.id] = e)));
    });
    return map;
  }, [unplanned, week]);
  const activeEntry = activeModal?.entryId ? entryById[activeModal.entryId] : null;

  // Close entry-based modals if their entry disappears.
  useEffect(() => {
    if (activeModal?.entryId && !activeEntry) setActiveModal(null);
  }, [activeModal, activeEntry]);

  const generate = (mode) => {
    const result = dispatch(generateShoppingList(mode));
    if (result.prechecked.length > 0 && showReminder) {
      setActiveModal({ type: "reminder", items: result.prechecked });
    } else {
      navigation.navigate("ShoppingList");
    }
  };

  const onGeneratePress = () => {
    if (entryCount === 0) {
      dialog.alert("Your menu is empty", "Add recipes from My Recipes first.");
    } else if (itemCount === 0) {
      generate("replace");
    } else {
      dialog.alert(
        "You already have a shopping list",
        "Replace it with a new list from this menu, or merge this menu's ingredients into it?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Merge", onPress: () => generate("merge") },
          { text: "Replace", style: "destructive", onPress: () => generate("replace") },
        ]
      );
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button onPress={onGeneratePress} title="Generate list" />,
    });
  });

  const onNewWeek = () =>
    dialog.alert("Start a new week?", "Your shopping list won't change.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear recipes, keep meal slots", onPress: () => dispatch(clearMenuEntries()) },
      { text: "Clear everything", style: "destructive", onPress: () => dispatch(clearMenu()) },
    ]);

  const onDayMenu = (day) =>
    dialog.alert(day.label, undefined, [
      { text: "Swap with another day…", onPress: () => setActiveModal({ type: "daySwap", day: day.day }) },
      { text: "Cancel", style: "cancel" },
    ]);

  const onCustomSlot = (day) =>
    dialog.prompt({
      title: "New meal slot",
      placeholder: "e.g. Brunch",
      confirmText: "Add",
      onSubmit: (name) => dispatch(addSlot({ day, name })),
    });

  const onSlotRename = (slot) =>
    dialog.prompt({
      title: "Rename meal slot",
      defaultValue: slot.name,
      confirmText: "Rename",
      onSubmit: (name) => dispatch(renameSlot({ slotId: slot.id, name })),
    });

  const onSlotRemove = (slot, dayLabel) => {
    const n = slot.entries.length;
    if (n === 0) {
      dispatch(removeSlot({ slotId: slot.id, removeEntries: false }));
      return;
    }
    dialog.alert(`Remove ${slot.name}?`, `What should happen to its ${n} recipe${n === 1 ? "" : "s"}?`, [
      { text: "Cancel", style: "cancel" },
      { text: `Keep them on ${dayLabel}`, onPress: () => dispatch(removeSlot({ slotId: slot.id, removeEntries: false })) },
      { text: "Remove them too", style: "destructive", onPress: () => dispatch(removeSlot({ slotId: slot.id, removeEntries: true })) },
    ]);
  };

  const dayLabelOf = (day) => week[day]?.label ?? "";
  const onSlotMenu = (slot) =>
    dialog.alert(slot.name, undefined, [
      { text: "Rename", onPress: () => onSlotRename(slot) },
      { text: "Move to another day…", onPress: () => setActiveModal({ type: "slotDay", slotId: slot.id }) },
      { text: "Remove", style: "destructive", onPress: () => onSlotRemove(slot, dayLabelOf(slot.day)) },
      { text: "Cancel", style: "cancel" },
    ]);

  const onEntryPress = (entry) => setActiveModal({ type: "entry", entryId: entry.id });
  const onEntryRemove = (entry) => dispatch(removeMenuEntry(entry.id));
  const onAddSlot = (day, name) => dispatch(addSlot({ day, name }));

  const swapGroups = useMemo(() => {
    const groups = [{ key: "unplanned", label: "Unplanned", entries: unplanned }];
    week.forEach((d) => {
      groups.push({ key: `day-${d.day}`, label: d.label, entries: d.entries });
      d.slots.forEach((s) => groups.push({ key: s.id, label: `${d.label} · ${s.name}`, entries: s.entries }));
    });
    return groups
      .map((g) => ({ ...g, entries: g.entries.filter((e) => e.id !== activeModal?.entryId) }))
      .filter((g) => g.entries.length > 0);
  }, [unplanned, week, activeModal?.entryId]);

  const entryLocation = useMemo(() => {
    if (!activeEntry) return null;
    if (activeEntry.slotId !== null) {
      for (const d of week) {
        const slot = d.slots.find((s) => s.id === activeEntry.slotId);
        if (slot) return `${d.label} · ${slot.name}`;
      }
      return null;
    }
    return activeEntry.day != null ? week[activeEntry.day].label : "Unplanned";
  }, [activeEntry, week]);

  const renderUnplanned = () => (
    <UnplannedSection entries={unplanned} onEntryPress={onEntryPress} onEntryRemove={onEntryRemove} />
  );

  const renderDay = (day) => (
    <MenuDay
      key={day.day}
      day={day}
      onDayMenu={onDayMenu}
      onAddSlot={onAddSlot}
      onCustomSlot={onCustomSlot}
      onSlotRename={onSlotRename}
      onSlotMenu={onSlotMenu}
      onEntryPress={onEntryPress}
      onEntryRemove={onEntryRemove}
    />
  );

  const toolbar = (
    <View style={styles.toolbar}>
      <Text style={styles.count}>{`${entryCount} recipe${entryCount === 1 ? "" : "s"} planned`}</Text>
      <Pressable style={styles.newWeek} onPress={onNewWeek} accessibilityRole="button">
        <Text style={styles.newWeekText}>New week</Text>
      </Pressable>
    </View>
  );

  const dragHint = (
    <Text style={styles.dragHint}>
      Tip: hold ≡ and drag a recipe onto a day or a meal to move it, or onto another recipe to swap. Drag a day's ≡ onto another day to swap days.
    </Text>
  );

  const colWidth = Math.max(150, Math.floor((width - 48) / 8));

  return (
    <View style={styles.screen}>
      {toolbar}
      {dragHint}
      <DragProvider>
        {isWide ? (
          <DragScrollView horizontal style={styles.flex} contentContainerStyle={styles.columns}>
            <ColumnScroll style={{ width: colWidth }} contentContainerStyle={styles.column}>
              {renderUnplanned()}
            </ColumnScroll>
            {week.map((day) => (
              <ColumnScroll key={day.day} style={{ width: colWidth }} contentContainerStyle={styles.column}>
                {renderDay(day)}
              </ColumnScroll>
            ))}
          </DragScrollView>
        ) : (
          <DragScrollView style={styles.flex} contentContainerStyle={styles.narrowContent}>
            {entryCount === 0 && slotCount === 0 ? (
              <Text style={styles.empty}>Your menu is empty. Swipe a recipe in My Recipes and tap Add to Menu.</Text>
            ) : null}
            {renderUnplanned()}
            {week.map(renderDay)}
          </DragScrollView>
        )}
      </DragProvider>

      <EntryOptionsModal
        visible={activeModal?.type === "entry" && !!activeEntry}
        entry={activeEntry}
        location={entryLocation}
        onClose={close}
        onSetScale={(scale) => dispatch(setMenuEntryScale({ entryId: activeEntry.id, scale }))}
        onMove={() => setActiveModal({ type: "slotPicker", entryId: activeEntry.id })}
        onSwap={() => setActiveModal({ type: "entryPicker", entryId: activeEntry.id })}
        onView={() => {
          const recipeId = activeEntry.recipeId;
          close();
          navigation.navigate("RecipeList", { screen: "Recipe Details", params: { recipeId } });
        }}
        onRemove={() => {
          dispatch(removeMenuEntry(activeEntry.id));
          close();
        }}
      />
      <SlotPickerModal
        visible={activeModal?.type === "slotPicker" && !!activeEntry}
        week={week}
        currentSlotId={activeEntry ? activeEntry.slotId : null}
        currentDay={activeEntry ? activeEntry.day ?? null : null}
        onClose={close}
        onSelectSlot={(slotId) => {
          dispatch(moveMenuEntry({ entryId: activeEntry.id, slotId }));
          close();
        }}
        onSelectDay={(day) => {
          dispatch(moveMenuEntryToDay({ entryId: activeEntry.id, day }));
          close();
        }}
        onAddSlotAndMove={(day, name) => {
          dispatch(addSlotAndMoveEntry({ day, name, entryId: activeEntry.id }));
          close();
        }}
      />
      <EntryPickerModal
        visible={activeModal?.type === "entryPicker" && !!activeEntry}
        groups={swapGroups}
        onClose={close}
        onSelect={(other) => {
          dispatch(swapMenuEntries({ entryIdA: activeEntry.id, entryIdB: other.id }));
          close();
        }}
      />
      <DayPickerModal
        visible={activeModal?.type === "daySwap"}
        title={"Swap with…"}
        excludeDay={activeModal?.day}
        onClose={close}
        onSelect={(day) => {
          dispatch(swapDays({ dayA: activeModal.day, dayB: day }));
          close();
        }}
      />
      <DayPickerModal
        visible={activeModal?.type === "slotDay"}
        title={"Move to…"}
        onClose={close}
        onSelect={(day) => {
          dispatch(moveSlot({ slotId: activeModal.slotId, day }));
          close();
        }}
      />
      <StapleReminderModal
        visible={activeModal?.type === "reminder"}
        items={activeModal?.type === "reminder" ? activeModal.items : []}
        onClose={() => {
          close();
          navigation.navigate("ShoppingList");
        }}
        onDisable={() => {
          dispatch(setShowStapleReminder(false));
          close();
          navigation.navigate("ShoppingList");
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  count: { color: colors.muted, fontSize: 15 },
  newWeek: { minHeight: 44, justifyContent: "center", paddingLeft: spacing.md },
  newWeekText: { color: colors.accentStrong, fontSize: 16, fontWeight: "bold" },
  dragHint: { color: colors.muted, fontSize: 13, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  narrowContent: { padding: spacing.lg },
  columns: { flexGrow: 1, padding: spacing.sm },
  column: { padding: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginBottom: spacing.lg },
  unplanned: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  unplannedHeader: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md, backgroundColor: colors.favorite },
  unplannedTitle: { fontSize: 17, fontWeight: "bold", color: colors.text },
  hint: { color: colors.muted, padding: spacing.md },
});

export default MenuScreen;
