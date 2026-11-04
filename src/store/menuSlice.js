import { createSlice, createEntityAdapter, createSelector } from "@reduxjs/toolkit";
import { deleteRecipe, loadRecipeList } from "./recipesSlice";
import { recipeList } from "../Recipes";
import { orderDaySlots } from "../domain/menuOrder";

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const SUGGESTED_SLOT_NAMES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const slotsAdapter = createEntityAdapter();
const entriesAdapter = createEntityAdapter();

export const initialState = {
  slots: slotsAdapter.getInitialState(),
  entries: entriesAdapter.getInitialState(),
  nextId: 1,
};

const isValidDay = (day) => Number.isInteger(day) && day >= 0 && day <= 6;

function createSlot(state, day, name) {
  const trimmed = String(name ?? "").trim() || "Meal";
  const id = `slot-${state.nextId}`;
  state.nextId += 1;
  slotsAdapter.addOne(state.slots, { id, day, name: trimmed });
  return id;
}

// Places the entry in a slot (day null), on a day without a slot, or in Unplanned
// (both null). An entry never has both slotId and day set.
function moveEntryToEnd(state, entryId, slotId, day = null) {
  const entry = state.entries.entities[entryId];
  entry.slotId = slotId;
  entry.day = slotId ? null : day;
  state.entries.ids = state.entries.ids.filter((id) => id !== entryId);
  state.entries.ids.push(entryId);
}

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    addRecipeToMenu: (state, action) => {
      const { recipeId, slotId = null, day = null, scale = 1 } = action.payload;
      const id = `entry-${state.nextId}`;
      state.nextId += 1;
      const validSlot = slotId && state.slots.entities[slotId] ? slotId : null;
      entriesAdapter.addOne(state.entries, {
        id,
        recipeId,
        slotId: validSlot,
        day: validSlot === null && isValidDay(day) ? day : null,
        scale,
      });
    },
    removeMenuEntry: (state, action) => {
      entriesAdapter.removeOne(state.entries, action.payload);
    },
    moveMenuEntry: (state, action) => {
      const { entryId, slotId = null } = action.payload;
      if (!state.entries.entities[entryId]) return;
      if (slotId !== null && !state.slots.entities[slotId]) return;
      moveEntryToEnd(state, entryId, slotId);
    },
    moveMenuEntryToDay: (state, action) => {
      const { entryId, day } = action.payload;
      const entry = state.entries.entities[entryId];
      if (!entry || !isValidDay(day)) return;
      if (entry.slotId === null && entry.day === day) return;
      moveEntryToEnd(state, entryId, null, day);
    },
    swapMenuEntries: (state, action) => {
      const { entryIdA, entryIdB } = action.payload;
      const a = state.entries.entities[entryIdA];
      const b = state.entries.entities[entryIdB];
      if (!a || !b || entryIdA === entryIdB) return;
      const slotA = a.slotId;
      const dayA = a.day ?? null;
      a.slotId = b.slotId;
      a.day = b.day ?? null;
      b.slotId = slotA;
      b.day = dayA;
      const ids = state.entries.ids;
      const ia = ids.indexOf(entryIdA);
      const ib = ids.indexOf(entryIdB);
      ids[ia] = entryIdB;
      ids[ib] = entryIdA;
    },
    setMenuEntryScale: (state, action) => {
      const { entryId, scale } = action.payload;
      const entry = state.entries.entities[entryId];
      const n = Number(scale);
      if (!entry || !Number.isFinite(n)) return;
      const clamped = Math.min(20, Math.max(0.25, n));
      entry.scale = Math.round(clamped * 100) / 100;
    },
    addSlot: (state, action) => {
      const { day, name } = action.payload;
      if (!isValidDay(day)) return;
      createSlot(state, day, name);
    },
    addSlotAndMoveEntry: (state, action) => {
      const { day, name, entryId } = action.payload;
      if (!isValidDay(day) || !state.entries.entities[entryId]) return;
      const slotId = createSlot(state, day, name);
      moveEntryToEnd(state, entryId, slotId);
    },
    renameSlot: (state, action) => {
      const { slotId, name } = action.payload;
      const trimmed = String(name ?? "").trim();
      const slot = state.slots.entities[slotId];
      if (!slot || !trimmed) return;
      slot.name = trimmed;
    },
    removeSlot: (state, action) => {
      const { slotId, removeEntries } = action.payload;
      if (!state.slots.entities[slotId]) return;
      const inSlot = state.entries.ids.filter(
        (id) => state.entries.entities[id].slotId === slotId
      );
      if (removeEntries) entriesAdapter.removeMany(state.entries, inSlot);
      else {
        const day = state.slots.entities[slotId].day;
        inSlot.forEach((id) => {
          const entry = state.entries.entities[id];
          entry.slotId = null;
          entry.day = day;
        });
      }
      slotsAdapter.removeOne(state.slots, slotId);
    },
    moveSlot: (state, action) => {
      const { slotId, day } = action.payload;
      const slot = state.slots.entities[slotId];
      if (!slot || !isValidDay(day)) return;
      slot.day = day;
      state.slots.ids = state.slots.ids.filter((id) => id !== slotId);
      state.slots.ids.push(slotId);
    },
    reorderSlot: (state, action) => {
      const { slotId, targetSlotId, position } = action.payload;
      const slot = state.slots.entities[slotId];
      const target = state.slots.entities[targetSlotId];
      if (!slot || !target || slotId === targetSlotId) return;
      slot.day = target.day;
      const ids = state.slots.ids.filter((id) => id !== slotId);
      const at = ids.indexOf(targetSlotId);
      ids.splice(position === "before" ? at : at + 1, 0, slotId);
      // Keep the day's ids in displayed order so later moves are relative to what the
      // user sees (B/L/D resolve to the nearest valid order).
      const positions = [];
      const daySlots = [];
      ids.forEach((id, i) => {
        if (state.slots.entities[id].day === target.day) {
          positions.push(i);
          daySlots.push(state.slots.entities[id]);
        }
      });
      orderDaySlots(daySlots).forEach((s, k) => (ids[positions[k]] = s.id));
      state.slots.ids = ids;
    },
    swapDays: (state, action) => {
      const { dayA, dayB } = action.payload;
      if (!isValidDay(dayA) || !isValidDay(dayB) || dayA === dayB) return;
      state.slots.ids.forEach((id) => {
        const slot = state.slots.entities[id];
        if (slot.day === dayA) slot.day = dayB;
        else if (slot.day === dayB) slot.day = dayA;
      });
      state.entries.ids.forEach((id) => {
        const entry = state.entries.entities[id];
        if (entry.slotId !== null) return;
        if (entry.day === dayA) entry.day = dayB;
        else if (entry.day === dayB) entry.day = dayA;
      });
    },
    clearMenuEntries: (state) => {
      entriesAdapter.removeAll(state.entries);
    },
    clearMenu: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteRecipe, (state, action) => {
        const doomed = state.entries.ids.filter(
          (id) => state.entries.entities[id].recipeId === action.payload
        );
        entriesAdapter.removeMany(state.entries, doomed);
      })
      .addCase(loadRecipeList, (state) => {
        const seedIds = new Set(recipeList.map((r) => r.id));
        const doomed = state.entries.ids.filter(
          (id) => !seedIds.has(state.entries.entities[id].recipeId)
        );
        entriesAdapter.removeMany(state.entries, doomed);
      });
  },
});

export const {
  addRecipeToMenu,
  removeMenuEntry,
  moveMenuEntry,
  moveMenuEntryToDay,
  swapMenuEntries,
  setMenuEntryScale,
  addSlot,
  addSlotAndMoveEntry,
  renameSlot,
  removeSlot,
  moveSlot,
  reorderSlot,
  swapDays,
  clearMenuEntries,
  clearMenu,
} = menuSlice.actions;

const slotSelectors = slotsAdapter.getSelectors((state) => state.menu.slots);
const entrySelectors = entriesAdapter.getSelectors((state) => state.menu.entries);
const selectRecipeEntities = (state) => state.recipes.entities;

export const selectMenuEntries = entrySelectors.selectAll;

// Entries joined to their recipe; entries whose recipe is gone are omitted.
const selectEntriesWithRecipe = createSelector(
  [entrySelectors.selectAll, selectRecipeEntities],
  (entries, recipes) =>
    entries
      .filter((entry) => recipes[entry.recipeId])
      .map((entry) => ({ ...entry, recipe: recipes[entry.recipeId] }))
);

export const selectUnplannedEntries = createSelector(
  [selectEntriesWithRecipe],
  (entries) => entries.filter((entry) => entry.slotId === null && entry.day == null)
);

export const selectMenuWeek = createSelector(
  [slotSelectors.selectAll, selectEntriesWithRecipe],
  (slots, entries) =>
    WEEK_DAYS.map((label, day) => ({
      day,
      label,
      entries: entries.filter((entry) => entry.slotId === null && entry.day === day),
      slots: orderDaySlots(slots.filter((slot) => slot.day === day)).map((slot) => ({
        ...slot,
        entries: entries.filter((entry) => entry.slotId === slot.id),
      })),
    }))
);

export const selectMenuEntryCount = createSelector(
  [selectEntriesWithRecipe],
  (entries) => entries.length
);

export default menuSlice.reducer;
