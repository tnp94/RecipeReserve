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
import {
  setShowStapleReminder,
  selectShowStapleReminder,
  setThemeName,
  selectThemeName,
  setHideMenuTip,
  selectHideMenuTip,
  setHideGettingStarted,
  selectHideGettingStarted,
  setFinderSort,
  selectFinderSort,
  setRecipeSort,
  selectRecipeSort,
} from "../settingsSlice";
import { addRecipeToMenu } from "../menuSlice";
import {
  addRecipe, toggleFavorite, isRecipeNameTaken, selectRecipeById, resetPlanHistory, resetAllPlanHistory,
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
  it("falls back to defaults for settings saved before themeName / tips existed", () => {
    const old = { settings: { showStapleReminder: true } };
    expect(selectThemeName(old)).toBe("freshWarm");
    expect(selectHideMenuTip(old)).toBe(false);
    expect(selectHideGettingStarted(old)).toBe(false);
    expect(selectFinderSort(old)).toBe("fewestMissing");
    expect(selectRecipeSort(old)).toBe("name");
  });

  it("stores the recipe list sort and ignores unknown values", () => {
    const store = make();
    expect(selectRecipeSort(store.getState())).toBe("name");
    store.dispatch(setRecipeSort("quickest"));
    expect(selectRecipeSort(store.getState())).toBe("quickest");
    store.dispatch(setRecipeSort("bogus"));
    expect(selectRecipeSort(store.getState())).toBe("quickest");
  });

  it("stores the finder sort and ignores unknown values", () => {
    const store = make();
    expect(selectFinderSort(store.getState())).toBe("fewestMissing");
    store.dispatch(setFinderSort("mostUsed"));
    expect(selectFinderSort(store.getState())).toBe("mostUsed");
    store.dispatch(setFinderSort("bogus"));
    expect(selectFinderSort(store.getState())).toBe("mostUsed");
  });

  it("stores theme name and tip flags", () => {
    const store = make();
    expect(selectThemeName(store.getState())).toBe("freshWarm");
    store.dispatch(setThemeName("  "));
    expect(selectThemeName(store.getState())).toBe("freshWarm");
    store.dispatch(setThemeName("other"));
    expect(selectThemeName(store.getState())).toBe("other");
    store.dispatch(setHideMenuTip(true));
    store.dispatch(setHideGettingStarted(true));
    expect(selectHideMenuTip(store.getState())).toBe(true);
    expect(selectHideGettingStarted(store.getState())).toBe(true);
  });

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

describe("recipe planning history", () => {
  it("adding a recipe to the menu records when and how often it was planned", () => {
    const store = make();
    store.dispatch(addRecipeToMenu({ recipeId: 2, plannedAt: 1000 }));
    store.dispatch(addRecipeToMenu({ recipeId: 2, plannedAt: 5000 }));
    const recipe = selectRecipeById(store.getState(), 2);
    expect(recipe.lastPlannedAt).toBe(5000);
    expect(recipe.timesPlanned).toBe(2);
  });

  it("stamps the current time when no plannedAt is given", () => {
    const store = make();
    const before = Date.now();
    store.dispatch(addRecipeToMenu({ recipeId: 3 }));
    expect(selectRecipeById(store.getState(), 3).lastPlannedAt).toBeGreaterThanOrEqual(before);
  });

  it("resetPlanHistory clears one recipe; resetAllPlanHistory clears every recipe", () => {
    const store = make();
    store.dispatch(addRecipeToMenu({ recipeId: 2, plannedAt: 1000 }));
    store.dispatch(addRecipeToMenu({ recipeId: 3, plannedAt: 2000 }));
    store.dispatch(resetPlanHistory(2));
    expect(selectRecipeById(store.getState(), 2).timesPlanned).toBeUndefined();
    expect(selectRecipeById(store.getState(), 2).lastPlannedAt).toBeUndefined();
    expect(selectRecipeById(store.getState(), 3).timesPlanned).toBe(1);
    expect(store.getState().menu.entries.ids).toHaveLength(2); // the menu is untouched
    store.dispatch(resetAllPlanHistory());
    expect(selectRecipeById(store.getState(), 3).timesPlanned).toBeUndefined();
  });

  it("a copy saved as a new recipe starts with no planning history", () => {
    const store = make();
    store.dispatch(addRecipe({ name: "Copy", ingredients: [], lastPlannedAt: 5, timesPlanned: 3 }));
    const s = store.getState();
    const copy = s.recipes.entities[s.recipes.ids[s.recipes.ids.length - 1]];
    expect(copy.lastPlannedAt).toBeUndefined();
    expect(copy.timesPlanned).toBeUndefined();
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

describe("finder Recent with remember: false", () => {
  const { configureStore } = require("@reduxjs/toolkit");
  const rootReducer = require("../rootReducer").default;
  const { addFinderIngredients, selectRecentFinderIngredients, selectFinderIngredients } = require("../finderSlice");
  it("adds staples to the search without pushing them into Recent", () => {
    const store = configureStore({ reducer: rootReducer });
    store.dispatch(addFinderIngredients(["Garlic"]));
    store.dispatch(addFinderIngredients({ names: ["Salt", "Oil"], remember: false }));
    expect(selectFinderIngredients(store.getState()).map((i) => i.name)).toEqual(["Garlic", "Salt", "Oil"]);
    expect(selectRecentFinderIngredients(store.getState())).toEqual(["Garlic"]);
  });
});
