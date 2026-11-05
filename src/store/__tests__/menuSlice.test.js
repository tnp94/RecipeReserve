import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../rootReducer";
import {
  addRecipeToMenu, removeMenuEntry, moveMenuEntry, swapMenuEntries, setMenuEntryScale,
  moveMenuEntryToDay, addSlot, addSlotAndMoveEntry, renameSlot, removeSlot, moveSlot, reorderSlot, swapDays,
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
    expect(s.menu.entries.entities["entry-2"]).toEqual({ id: "entry-2", recipeId: 2, slotId: null, day: null, scale: 1 });
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
    expect(s.menu.entries.entities["entry-3"].day).toBe(0); // kept on the slot's day
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

  it("reorderSlot inserts before/after the target and adopts its day", () => {
    const store = make();
    ["A", "B", "C"].forEach((name) => store.dispatch(addSlot({ day: 0, name })));
    store.dispatch(addSlot({ day: 3, name: "D" })); // slot-4
    store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "slot-3" }));
    store.dispatch(reorderSlot({ slotId: "slot-3", targetSlotId: "slot-1", position: "before" }));
    expect(store.getState().menu.slots.ids).toEqual(["slot-3", "slot-1", "slot-2", "slot-4"]);
    store.dispatch(reorderSlot({ slotId: "slot-3", targetSlotId: "slot-2", position: "after" }));
    expect(store.getState().menu.slots.ids).toEqual(["slot-1", "slot-2", "slot-3", "slot-4"]);
    store.dispatch(reorderSlot({ slotId: "slot-1", targetSlotId: "slot-4", position: "before" }));
    const s = store.getState();
    expect(s.menu.slots.ids).toEqual(["slot-2", "slot-3", "slot-1", "slot-4"]);
    expect(s.menu.slots.entities["slot-1"].day).toBe(3);
    expect(s.menu.entries.entities["entry-5"].slotId).toBe("slot-3");
    expect(selectMenuWeek(s)[3].slots.map((x) => x.name)).toEqual(["A", "D"]);
  });

  it("reorderSlot ignores missing or identical slots", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "A" }));
    store.dispatch(addSlot({ day: 1, name: "B" }));
    const before = store.getState().menu;
    store.dispatch(reorderSlot({ slotId: "slot-1", targetSlotId: "slot-1", position: "after" }));
    store.dispatch(reorderSlot({ slotId: "slot-1", targetSlotId: "nope", position: "after" }));
    store.dispatch(reorderSlot({ slotId: "nope", targetSlotId: "slot-2", position: "after" }));
    expect(store.getState().menu).toEqual(before);
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

  it("clearMenuEntries keeps slots; clearMenu clears slots and entries but keeps the id counter", () => {
    const store = make();
    store.dispatch(addSlot({ day: 0, name: "A" }));
    store.dispatch(addRecipeToMenu({ recipeId: 2 }));
    store.dispatch(clearMenuEntries());
    expect(store.getState().menu.slots.ids).toHaveLength(1);
    expect(entryIds(store.getState())).toEqual([]);
    const before = store.getState().menu.nextId;
    store.dispatch(clearMenu());
    expect(store.getState().menu.slots.ids).toEqual([]);
    expect(store.getState().menu.nextId).toBe(before);
    store.dispatch(addRecipeToMenu({ recipeId: 2 }));
    expect(entryIds(store.getState())).toEqual([`entry-${before}`]); // never reuses entry-2
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

  describe("day-level entries", () => {
    const e = (store, id) => store.getState().menu.entries.entities[id];
    const invariant = (store) =>
      selectMenuEntries(store.getState()).forEach((x) => expect(x.slotId !== null && x.day != null).toBe(false));

    it("addRecipeToMenu stores day only without a valid slot and for 0-6", () => {
      const store = make();
      store.dispatch(addSlot({ day: 2, name: "Lunch" })); // slot-1
      store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "slot-1", day: 4 })); // entry-2
      store.dispatch(addRecipeToMenu({ recipeId: 2, day: 4 })); // entry-3
      store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "nope", day: 1 })); // entry-4
      store.dispatch(addRecipeToMenu({ recipeId: 2, day: 9 })); // entry-5
      expect([e(store, "entry-2").slotId, e(store, "entry-2").day]).toEqual(["slot-1", null]);
      expect([e(store, "entry-3").slotId, e(store, "entry-3").day]).toEqual([null, 4]);
      expect([e(store, "entry-4").slotId, e(store, "entry-4").day]).toEqual([null, 1]);
      expect(e(store, "entry-5").day).toBeNull();
      invariant(store);
    });

    it("moveMenuEntryToDay clears slot, moves to end, ignores bad day and no-ops", () => {
      const store = make();
      store.dispatch(addSlot({ day: 0, name: "A" }));
      store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "slot-1" })); // entry-2
      store.dispatch(addRecipeToMenu({ recipeId: 3 })); // entry-3
      store.dispatch(moveMenuEntryToDay({ entryId: "entry-2", day: 0 }));
      expect([e(store, "entry-2").slotId, e(store, "entry-2").day]).toEqual([null, 0]);
      expect(entryIds(store.getState())).toEqual(["entry-3", "entry-2"]);
      store.dispatch(moveMenuEntryToDay({ entryId: "entry-3", day: 0 }));
      expect(entryIds(store.getState())).toEqual(["entry-2", "entry-3"]);
      store.dispatch(moveMenuEntryToDay({ entryId: "entry-2", day: 0 })); // no-op: stays first
      expect(entryIds(store.getState())).toEqual(["entry-2", "entry-3"]);
      store.dispatch(moveMenuEntryToDay({ entryId: "entry-2", day: 7 }));
      store.dispatch(moveMenuEntryToDay({ entryId: "missing", day: 1 }));
      expect(e(store, "entry-2").day).toBe(0);
      invariant(store);
    });

    it("moveMenuEntry and addSlotAndMoveEntry clear day", () => {
      const store = make();
      store.dispatch(addSlot({ day: 0, name: "A" })); // slot-1
      store.dispatch(addRecipeToMenu({ recipeId: 2, day: 3 })); // entry-2
      store.dispatch(moveMenuEntry({ entryId: "entry-2", slotId: "slot-1" }));
      expect([e(store, "entry-2").slotId, e(store, "entry-2").day]).toEqual(["slot-1", null]);
      store.dispatch(addRecipeToMenu({ recipeId: 3, day: 3 })); // entry-3
      store.dispatch(addSlotAndMoveEntry({ day: 5, name: "B", entryId: "entry-3" }));
      expect([e(store, "entry-3").slotId, e(store, "entry-3").day]).toEqual(["slot-4", null]);
      store.dispatch(moveMenuEntry({ entryId: "entry-3", slotId: null }));
      expect([e(store, "entry-3").slotId, e(store, "entry-3").day]).toEqual([null, null]);
      invariant(store);
    });

    it("swapMenuEntries swaps slotId and day", () => {
      const store = make();
      store.dispatch(addSlot({ day: 0, name: "A" })); // slot-1
      store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "slot-1" })); // entry-2
      store.dispatch(addRecipeToMenu({ recipeId: 3, day: 4 })); // entry-3
      store.dispatch(swapMenuEntries({ entryIdA: "entry-2", entryIdB: "entry-3" }));
      expect([e(store, "entry-2").slotId, e(store, "entry-2").day]).toEqual([null, 4]);
      expect([e(store, "entry-3").slotId, e(store, "entry-3").day]).toEqual(["slot-1", null]);
      invariant(store);
    });

    it("removeSlot keeps entries day-level on the slot's day", () => {
      const store = make();
      store.dispatch(addSlot({ day: 3, name: "A" }));
      store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "slot-1" }));
      store.dispatch(removeSlot({ slotId: "slot-1", removeEntries: false }));
      expect([e(store, "entry-2").slotId, e(store, "entry-2").day]).toEqual([null, 3]);
      expect(selectUnplannedEntries(store.getState())).toHaveLength(0);
      invariant(store);
    });

    it("swapDays swaps day-level entries too and leaves others alone", () => {
      const store = make();
      store.dispatch(addSlot({ day: 0, name: "A" })); // slot-1
      store.dispatch(addRecipeToMenu({ recipeId: 2, day: 0 })); // entry-2
      store.dispatch(addRecipeToMenu({ recipeId: 3, day: 2 })); // entry-3
      store.dispatch(addRecipeToMenu({ recipeId: 4, day: 5 })); // entry-4
      store.dispatch(addRecipeToMenu({ recipeId: 5 })); // entry-5 unplanned
      store.dispatch(addRecipeToMenu({ recipeId: 6, slotId: "slot-1" })); // entry-6
      store.dispatch(swapDays({ dayA: 0, dayB: 2 }));
      expect([2, 3, 4, 5].map((n) => e(store, `entry-${n}`).day)).toEqual([2, 0, 5, null]);
      expect(e(store, "entry-6")).toMatchObject({ slotId: "slot-1", day: null });
      invariant(store);
    });

    it("selectors split day-level, slot and unplanned entries", () => {
      const store = make();
      store.dispatch(addSlot({ day: 1, name: "Dinner" }));
      store.dispatch(addRecipeToMenu({ recipeId: 2, slotId: "slot-1" }));
      store.dispatch(addRecipeToMenu({ recipeId: 3, day: 1 }));
      store.dispatch(addRecipeToMenu({ recipeId: 1, day: 1 }));
      store.dispatch(addRecipeToMenu({ recipeId: 3 }));
      const s = store.getState();
      const week = selectMenuWeek(s);
      expect(week[1].entries.map((x) => x.recipeId)).toEqual([3, 1]);
      expect(week[1].entries[0].recipe.id).toBe(3);
      expect(week[1].slots[0].entries.map((x) => x.recipeId)).toEqual([2]);
      expect(week[0].entries).toEqual([]);
      expect(selectUnplannedEntries(s).map((x) => x.recipeId)).toEqual([3]);
      expect(selectMenuEntryCount(s)).toBe(4);
    });

    it("selectMenuWeek orders breakfast/lunch/dinner within a day", () => {
      const store = make();
      ["Dinner", "Snack", "Breakfast"].forEach((name) => store.dispatch(addSlot({ day: 0, name })));
      expect(selectMenuWeek(store.getState())[0].slots.map((x) => x.name)).toEqual(["Breakfast", "Snack", "Dinner"]);
      expect(store.getState().menu.slots.ids).toEqual(["slot-1", "slot-2", "slot-3"]);
    });

    it("treats a missing day (legacy entry) as unplanned", () => {
      const store = make();
      store.dispatch(addRecipeToMenu({ recipeId: 2 }));
      const legacy = { ...store.getState(), menu: JSON.parse(JSON.stringify(store.getState().menu)) };
      delete legacy.menu.entries.entities["entry-1"].day;
      expect(selectUnplannedEntries(legacy)).toHaveLength(1);
    });
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

describe("reorderSlot keeps ids in displayed order", () => {
  it("dropping Dinner above Breakfast leaves Snack, Breakfast, Dinner in ids", () => {
    const store = configureStore({ reducer: rootReducer });
    ["Breakfast", "Dinner", "Snack"].forEach((name) => store.dispatch(addSlot({ day: 0, name })));
    store.dispatch(reorderSlot({ slotId: "slot-3", targetSlotId: "slot-1", position: "before" })); // Snack first
    store.dispatch(reorderSlot({ slotId: "slot-2", targetSlotId: "slot-1", position: "before" })); // Dinner above Breakfast
    expect(store.getState().menu.slots.ids).toEqual(["slot-3", "slot-1", "slot-2"]);
  });
});
