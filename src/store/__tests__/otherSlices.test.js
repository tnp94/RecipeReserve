import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../rootReducer";
import {
  addFinderIngredients, removeFinderIngredient, setFinderIngredientTag,
  clearFinderIngredients, selectFinderIngredients,
  clearRecentFinderIngredients, selectRecentFinderIngredients,
} from "../finderSlice";
import {
  addStaple, removeStaple, toggleStaple, selectStaplesList, selectStapleKeys, selectIsStaple,
} from "../pantrySlice";
import { setShowStapleReminder, selectShowStapleReminder } from "../settingsSlice";
import {
  addRecipe, toggleFavorite, isRecipeNameTaken, selectRecipeById,
} from "../recipesSlice";

const make = () => configureStore({ reducer: rootReducer });

describe("finderSlice", () => {
  it("dedupes by normalized name, trims, ignores empty", () => {
    const store = make();
    store.dispatch(addFinderIngredients([" Onions ", "onion", "", "  ", "Garlic", "garlic"]));
    const list = selectFinderIngredients(store.getState());
    expect(list.map((i) => i.name)).toEqual(["Onions", "Garlic"]);
    expect(list.map((i) => i.id)).toEqual(["fi-1", "fi-2"]);
    store.dispatch(addFinderIngredients(["ONION", "Rice"]));
    expect(selectFinderIngredients(store.getState())).toHaveLength(3);
  });

  it("tags, removes, clears", () => {
    const store = make();
    store.dispatch(addFinderIngredients(["a1", "b1"]));
    store.dispatch(setFinderIngredientTag({ id: "fi-1", tag: "expiring" }));
    store.dispatch(setFinderIngredientTag({ id: "fi-2", tag: "bogus" }));
    expect(selectFinderIngredients(store.getState()).map((i) => i.tag)).toEqual(["expiring", null]);
    store.dispatch(removeFinderIngredient("fi-1"));
    expect(selectFinderIngredients(store.getState())).toHaveLength(1);
    store.dispatch(clearFinderIngredients());
    expect(selectFinderIngredients(store.getState())).toEqual([]);
  });
});

describe("pantrySlice", () => {
  it("adds, removes, toggles, sorts", () => {
    const store = make();
    store.dispatch(addStaple(" Salt "));
    store.dispatch(addStaple("olive oil"));
    store.dispatch(addStaple("  "));
    store.dispatch(toggleStaple("Pepper"));
    expect(selectStaplesList(store.getState()).map((s) => s.name)).toEqual(["olive oil", "Pepper", "Salt"]);
    expect(selectIsStaple(store.getState(), "salts")).toBe(true);
    expect(selectStapleKeys(store.getState()).has("olive oil")).toBe(true);
    store.dispatch(toggleStaple("pepper"));
    store.dispatch(removeStaple("salt"));
    expect(selectStaplesList(store.getState()).map((s) => s.nameKey)).toEqual(["olive oil"]);
  });

  it("memoizes selectStapleKeys", () => {
    const store = make();
    store.dispatch(addStaple("salt"));
    const a = selectStapleKeys(store.getState());
    store.dispatch(setShowStapleReminder(false));
    expect(selectStapleKeys(store.getState())).toBe(a);
  });
});

describe("settingsSlice", () => {
  it("defaults true and toggles", () => {
    const store = make();
    expect(selectShowStapleReminder(store.getState())).toBe(true);
    store.dispatch(setShowStapleReminder(false));
    expect(selectShowStapleReminder(store.getState())).toBe(false);
  });
});

describe("recipesSlice additions", () => {
  it("toggleFavorite flips", () => {
    const store = make();
    const before = selectRecipeById(store.getState(), 2).favorite;
    store.dispatch(toggleFavorite(2));
    expect(selectRecipeById(store.getState(), 2).favorite).toBe(!before);
  });

  it("isRecipeNameTaken is case-insensitive, trimmed, excludes id", () => {
    const store = make();
    const s = store.getState();
    expect(isRecipeNameTaken(s, "  basic TEMPLATE ")).toBe(true);
    expect(isRecipeNameTaken(s, "basic template", 1)).toBe(false);
    expect(isRecipeNameTaken(s, "nope")).toBe(false);
    store.dispatch(addRecipe({ name: "Zed", ingredients: [] }));
    expect(isRecipeNameTaken(store.getState(), "zed")).toBe(true);
  });
});

describe("finderSlice recent", () => {
  it("tracks recent most-recent-first, de-duplicated, capped at 12", () => {
    const store = make();
    store.dispatch(addFinderIngredients(["Onion", "Garlic"]));
    expect(selectRecentFinderIngredients(store.getState())).toEqual(["Garlic", "Onion"]);
    store.dispatch(addFinderIngredients(["onions"]));
    expect(selectRecentFinderIngredients(store.getState())).toEqual(["onions", "Garlic"]);
    expect(selectFinderIngredients(store.getState())).toHaveLength(2);
    store.dispatch(addFinderIngredients(Array.from({ length: 15 }, (_, i) => `item${String.fromCharCode(97 + i)}`)));
    expect(selectRecentFinderIngredients(store.getState())).toHaveLength(12);
    store.dispatch(clearRecentFinderIngredients());
    expect(selectRecentFinderIngredients(store.getState())).toEqual([]);
    expect(selectFinderIngredients(store.getState()).length).toBeGreaterThan(0);
  });
});
