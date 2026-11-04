import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../rootReducer";
import {
  addRecipeToMenu, removeMenuEntry, moveMenuEntry, swapMenuEntries, setMenuEntryScale,
  addSlot, addSlotAndMoveEntry, renameSlot, removeSlot, moveSlot, swapDays,
  clearMenuEntries, clearMenu, selectMenuEntries, selectMenuWeek, selectUnplannedEntries,
  selectMenuEntryCount, WEEK_DAYS, SUGGESTED_SLOT_NAMES,
} from "../menuSlice";
import { deleteRecipe, loadRecipeList } from "../recipesSlice";

const make = () => configureStore({ reducer: rootReducer });
const entryIds = (s) => selectMenuEntries(s).map((e) => e.id);

describe("menuSlice", () => {
  it("exports constants", () => {
    expect(WEEK_DAYS).toHaveLength(7);
    expect(SUGGESTED_SLOT_NAMES).toEqual(["Breakfast", "Lunch", "Dinner", "Snack"]);
  });

  it("adds entries with incrementing shared ids", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "Lunch" }));
    store.dispatch(addRecipeToMenu({ recipeId: 2 }));
    const s = store.getState();
    expect(s.menu.slots.ids).toEqual(["slot-1"]);
    expect(s.menu.entries.entities["entry-2"]).toEqual({ id: "entry-2", recipeId: 2, slotId: null, scale: 1 });
    expect(s.menu.nextId).toBe(3);
  });

  it("addSlot trims and defaults name", () => {
    const store = make();
    store.dispatch(addSlot({ day: 1, name: "  Brunch " }));
    store.dispatch(addSlot({ day: 1, name: "   " }));
    expect(store.getState().menu.slots.ids.map((id) => store.getState().menu.slots.entities[id].name)).toEqual(["Brunch", "Meal"]);
  });

  it("removes an entry", () => {
    const store = make();
    store.dispatch(addRecipeToMenu({ recipeId: 2 }));
    store.dispatch(removeMenuEntry("entry-1"));
    expect(entryIds(store.getState())).toEqual([]);
  });

  it("moves an entry to end of order and to null", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "Dinner" }));
    store.dispatch(addRecipeToMenu({ recipeId: 2 })); // entry-2
    store.dispatch(addRecipeToMenu({ recipeId: 3 })); // entry-3
    store.dispatch(moveMenuEntry({ entryId: "entry-2", slotId: "slot-1" }));
    expect(entryIds(store.getState())).toEqual(["entry-3", "entry-2"]);
    expect(store.getState().menu.entries.entities["entry-2"].slotId).toBe("slot-1");
    store.dispatch(moveMenuEntry({ entryId: "entry-2", slotId: null }));
    expect(store.getState().menu.entries.entities["entry-2"].slotId).toBeNull();
  });

  it("swaps slotIds and positions", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "Dinner" }));
    store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "slot-1" })); // entry-2
    store.dispatch(addRecipeToMenu({ recipeId: 3 })); // entry-3
    store.dispatch(swapMenuEntries({ entryIdA: "entry-2", entryIdB: "entry-3" }));
    const s = store.getState();
    expect(s.menu.entries.entities["entry-2"].slotId).toBeNull();
    expect(s.menu.entries.entities["entry-3"].slotId).toBe("slot-1");
    expect(entryIds(s)).toEqual(["entry-3", "entry-2"]);
  });

  it("clamps and rounds scale", () => {
    const store = make();
    store.dispatch(addRecipeToMenu({ recipeId: 2 }));
    const scale = () => store.getState().menu.entries.entities["entry-1"].scale;
    store.dispatch(setMenuEntryScale({ entryId: "entry-1", scale: 100 }));
    expect(scale()).toBe(20);
    store.dispatch(setMenuEntryScale({ entryId: "entry-1", scale: 0 }));
    expect(scale()).toBe(0.25);
    store.dispatch(setMenuEntryScale({ entryId: "entry-1", scale: 1.23456 }));
    expect(scale()).toBe(1.23);
  });

  it("addSlotAndMoveEntry creates slot and moves entry", () => {
    const store = make();
    store.dispatch(addRecipeToMenu({ recipeId: 2 }));
    store.dispatch(addSlotAndMoveEntry({ day: 3, name: "Lunch", entryId: "entry-1" }));
    const s = store.getState();
    expect(s.menu.slots.entities["slot-2"]).toEqual({ id: "slot-2", day: 3, name: "Lunch" });
    expect(s.menu.entries.entities["entry-1"].slotId).toBe("slot-2");
  });

  it("renames slot, ignoring empty", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "A" }));
    store.dispatch(renameSlot({ slotId: "slot-1", name: " B " }));
    store.dispatch(renameSlot({ slotId: "slot-1", name: "  " }));
    expect(store.getState().menu.slots.entities["slot-1"].name).toBe("B");
  });

  it("removeSlot unplans or deletes entries", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "A" }));
    store.dispatch(addSlot({ day: 0, name: "B" }));
    store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "slot-1" })); // entry-3
    store.dispatch(addRecipeToMenu({ recipeId: 3, slotId: "slot-2" })); // entry-4
    store.dispatch(removeSlot({ slotId: "slot-1", removeEntries: false }));
    store.dispatch(removeSlot({ slotId: "slot-2", removeEntries: true }));
    const s = store.getState();
    expect(s.menu.slots.ids).toEqual([]);
    expect(entryIds(s)).toEqual(["entry-3"]);
    expect(s.menu.entries.entities["entry-3"].slotId).toBeNull();
  });

  it("moveSlot changes day and goes to end", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "A" }));
    store.dispatch(addSlot({ day: 0, name: "B" }));
    store.dispatch(moveSlot({ slotId: "slot-1", day: 4 }));
    const s = store.getState();
    expect(s.menu.slots.ids).toEqual(["slot-2", "slot-1"]);
    expect(s.menu.slots.entities["slot-1"].day).toBe(4);
  });

  it("swapDays swaps all slots", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "A" }));
    store.dispatch(addSlot({ day: 2, name: "B" }));
    store.dispatch(addSlot({ day: 5, name: "C" }));
    store.dispatch(swapDays({ dayA: 0, dayB: 2 }));
    const e = store.getState().menu.slots.entities;
    expect([e["slot-1"].day, e["slot-2"].day, e["slot-3"].day]).toEqual([2, 0, 5]);
  });

  it("clearMenuEntries keeps slots; clearMenu resets", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "A" }));
    store.dispatch(addRecipeToMenu({ recipeId: 2 }));
    store.dispatch(clearMenuEntries());
    expect(store.getState().menu.slots.ids).toHaveLength(1);
    expect(entryIds(store.getState())).toEqual([]);
    store.dispatch(clearMenu());
    expect(store.getState().menu.slots.ids).toEqual([]);
    expect(store.getState().menu.nextId).toBe(1);
  });

  it("cascades on deleteRecipe", () => {
    const store = make();
    store.dispatch(addRecipeToMenu({ recipeId: 2 }));
    store.dispatch(addRecipeToMenu({ recipeId: 3 }));
    store.dispatch(deleteRecipe(2));
    expect(selectMenuEntries(store.getState()).map((e) => e.recipeId)).toEqual([3]);
  });

  it("cascades on loadRecipeList for ids not in seed", () => {
    const store = make();
    store.dispatch(addRecipeToMenu({ recipeId: 2 }));
    store.dispatch(addRecipeToMenu({ recipeId: 9999 }));
    store.dispatch(loadRecipeList());
    expect(selectMenuEntries(store.getState()).map((e) => e.recipeId)).toEqual([2]);
  });

  describe("selectors", () => {
    it("builds the week and unplanned, omitting entries without recipes", () => {
      const store = make();
      store.dispatch(addSlot({ day: 1, name: "Dinner" }));
      store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "slot-1" }));
      store.dispatch(addRecipeToMenu({ recipeId: 3 }));
      store.dispatch(addRecipeToMenu({ recipeId: 9999 }));
      const s = store.getState();
      const week = selectMenuWeek(s);
      expect(week).toHaveLength(7);
      expect(week[1].label).toBe("Tuesday");
      expect(week[1].slots[0].entries[0].recipe.id).toBe(2);
      expect(selectUnplannedEntries(s).map((e) => e.recipeId)).toEqual([3]);
      expect(selectMenuEntryCount(s)).toBe(2);
    });

    it("is memoized across unrelated state changes", () => {
      const store = make();
      store.dispatch(addRecipeToMenu({ recipeId: 2 }));
      const a = selectMenuWeek(store.getState());
      const u = selectUnplannedEntries(store.getState());
      store.dispatch({ type: "settings/setShowStapleReminder", payload: false });
      expect(selectMenuWeek(store.getState())).toBe(a);
      expect(selectUnplannedEntries(store.getState())).toBe(u);
    });
  });
});
