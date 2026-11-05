import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  addSlot,
  addSlotAndMoveEntry,
  clearMenu,
  clearMenuEntries,
  moveMenuEntry,
  moveMenuEntryToDay,
  moveSlot,
  reorderSlot,
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
import { moveSlotTarget } from "../domain/menuOrder";
import { todayIndex } from "../domain/week";
import { selectHideMenuTip, setHideMenuTip } from "../store/settingsSlice";
import { useDialog } from "../components/dialog/DialogProvider";
import useLayout from "../hooks/useLayout";
import useGenerateList from "../hooks/useGenerateList";
import { elevation, makeStyles, radius, spacing, useTheme } from "../theme";
import DragProvider, { DragScrollView, useDropOverStyle } from "../components/menu/drag/DragProvider";
import useDropZone from "../components/menu/drag/useDropZone";
import { menuDropAction } from "../domain/menuDrag";
import MenuDay from "../components/menu/MenuDay";
import MenuEntryRow from "../components/menu/MenuEntryRow";
import EntryOptionsModal from "../components/menu/EntryOptionsModal";
import SlotPickerModal from "../components/menu/SlotPickerModal";
import EntryPickerModal from "../components/menu/EntryPickerModal";
import DayPickerModal from "../components/menu/DayPickerModal";
import { AppText, Button, HeaderButton, IconButton } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";

// activeModal: null | { type: "entry"|"slotPicker"|"entryPicker", entryId }
//   | { type: "daySwap", day } | { type: "slotDay", slotId }
const UnplannedSection = ({ entries, onEntryPress, onEntryRemove }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const styles = useStyles();
  const dropOverStyle = useDropOverStyle();
  const { ref, isOver } = useDropZone({
    key: "unplanned",
    accepts: ["entry"],
    actionFor: (p) => menuDropAction({ kind: "unplanned", entries }, p),
    onDrop: (p) => dispatch(moveMenuEntry({ entryId: p.id, slotId: null })),
  });
  return (
    <View ref={ref} collapsable={false} style={[styles.unplanned, dropOverStyle(isOver)]}>
      <View style={styles.unplannedHeader}>
        <Ionicons name="time-outline" size={18} color={theme.colors.onAccentSoft} />
        <AppText variant="subheading" style={{ color: theme.colors.onAccentSoft, flex: 1 }}>Unplanned</AppText>
        {entries.length > 0 ? <AppText variant="small" style={{ color: theme.colors.onAccentSoft }}>{entries.length}</AppText> : null}
      </View>
      {entries.length === 0 ? (
        <AppText variant="small" tone="muted" style={styles.hint}>
          Recipes added with "Not sure yet" wait here. Tap one to give it a day.
        </AppText>
      ) : (
        entries.map((entry) => (
          <MenuEntryRow key={entry.id} entry={entry} onPress={() => onEntryPress(entry)} onRemove={() => onEntryRemove(entry)} />
        ))
      )}
    </View>
  );
};

const MenuScreen = ({ navigation }) => {
  const unplanned = useSelector(selectUnplannedEntries);
  const week = useSelector(selectMenuWeek);
  const slotsState = useSelector((state) => state.menu.slots);
  const entryCount = useSelector(selectMenuEntryCount);
  const hideTip = useSelector(selectHideMenuTip);
  const dispatch = useDispatch();
  const dialog = useDialog();
  const styles = useStyles();
  const theme = useTheme();
  const { width, isWide } = useLayout();
  const [activeModal, setActiveModal] = useState(null);
  const { onGenerate, reminderModal } = useGenerateList(navigation);
  const today = todayIndex();

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ marginRight: spacing.md }}>
          <HeaderButton label="Generate list" icon="cart-outline" filled onPress={onGenerate} />
        </View>
      ),
    });
  }, [navigation, onGenerate]);

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
  const onSlotMenu = (slot) => {
    const inIdOrder = slotsState.ids.map((id) => slotsState.entities[id]).filter((s) => s.day === slot.day);
    const nudge = (direction, text) => {
      const t = moveSlotTarget(inIdOrder, slot.id, direction);
      return t ? [{ text, onPress: () => dispatch(reorderSlot({ slotId: slot.id, ...t })) }] : [];
    };
    return dialog.alert(slot.name, undefined, [
      { text: "Rename", onPress: () => onSlotRename(slot) },
      ...nudge("up", "Move up"),
      ...nudge("down", "Move down"),
      { text: "Move to another day…", onPress: () => setActiveModal({ type: "slotDay", slotId: slot.id }) },
      { text: "Remove", style: "destructive", onPress: () => onSlotRemove(slot, dayLabelOf(slot.day)) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

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
      isToday={day.day === today}
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
      <AppText variant="small" tone="muted" style={styles.flex}>
        {entryCount === 0 ? "No recipes planned yet" : `${entryCount} recipe${entryCount === 1 ? "" : "s"} planned this week`}
      </AppText>
      <Button label="New week" icon="refresh-outline" variant="ghost" size="sm" onPress={onNewWeek} />
    </View>
  );

  const dragHint = hideTip ? null : (
    <View style={styles.tip}>
      <Ionicons name="bulb-outline" size={18} color={theme.colors.warning} />
      <AppText variant="small" tone="muted" style={styles.flex}>
        Tap a recipe to move, swap or scale it. Or drag it by its handle onto a day, a meal or another recipe.
      </AppText>
      <IconButton icon="close" size={18} accessibilityLabel="Hide tip" onPress={() => dispatch(setHideMenuTip(true))} />
    </View>
  );

  const colWidth = Math.max(230, Math.floor((width - 48) / 8));

  return (
    <View style={styles.screen}>
      {toolbar}
      {dragHint}
      <DragProvider>
        {isWide ? (
          <DragScrollView horizontal style={styles.flex} contentContainerStyle={styles.columns}>
            {/* Each column is its own vertical auto-scroll target while dragging. */}
            <DragScrollView style={{ width: colWidth }} contentContainerStyle={styles.column}>
              {renderUnplanned()}
            </DragScrollView>
            {week.map((day) => (
              <DragScrollView key={day.day} style={{ width: colWidth }} contentContainerStyle={styles.column}>
                {renderDay(day)}
              </DragScrollView>
            ))}
          </DragScrollView>
        ) : (
          <DragScrollView style={styles.flex} contentContainerStyle={styles.narrowContent}>
            {entryCount === 0 && slotCount === 0 ? (
              <View style={styles.emptyCard}>
                <AppText variant="subheading">Plan your week</AppText>
                <AppText variant="small" tone="muted">
                  Add recipes from the Recipes tab with the + button. They'll show up on the day you pick.
                </AppText>
                <Button
                  label="Browse recipes"
                  variant="tonal"
                  size="sm"
                  icon="book-outline"
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate("RecipeList", { screen: "My Recipes" })}
                />
              </View>
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
          // initial: false keeps My Recipes underneath, even if the Recipes stack hasn't been opened yet.
          navigation.navigate("RecipeList", { screen: "Recipe Details", params: { recipeId }, initial: false });
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
        excludeDay={activeModal?.type === "slotDay" ? slotsState.entities[activeModal.slotId]?.day : undefined}
        onClose={close}
        onSelect={(day) => {
          dispatch(moveSlot({ slotId: activeModal.slotId, day }));
          close();
        }}
      />
      {reminderModal}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    minHeight: 44,
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
    backgroundColor: t.colors.surfaceAlt,
  },
  narrowContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  columns: { flexGrow: 1, padding: spacing.sm },
  column: { padding: spacing.sm },
  emptyCard: {
    backgroundColor: t.colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  emptyButton: { alignSelf: "flex-start", marginTop: spacing.sm },
  unplanned: {
    backgroundColor: t.colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: t.colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...elevation(t, 1),
  },
  unplannedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    backgroundColor: t.colors.accentSoft,
  },
  hint: { padding: spacing.md },
}));

export default MenuScreen;
