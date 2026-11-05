import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../rootReducer";
import { generateShoppingList, addItemsToShoppingList } from "../thunks";
import { addRecipe } from "../recipesSlice";
import { addRecipeToMenu, setMenuEntryScale } from "../menuSlice";
import { addStaple } from "../pantrySlice";
import { selectShoppingItems, toggleItemChecked } from "../shoppingListSlice";

const make = () => {
  const store = configureStore({ reducer: rootReducer });
  store.dispatch(addRecipe({
    name: "Soup", favorite: false,
    ingredients: [
      { name: "Onions", quantityUnit: "1", unit: "", note: "", category: "Produce" },
      { name: "Salt", quantityUnit: "1", unit: "tsp", note: "", category: "" },
    ],
  }));
  store.dispatch(addRecipe({
    name: "Stew", favorite: false,
    ingredients: [{ name: "onion", quantityUnit: "2", unit: "each", note: "", category: "" }],
  }));
  return store;
};
const soupId = (s) => Object.values(s.getState().recipes.entities).find((r) => r.name === "Soup").id;
const stewId = (s) => Object.values(s.getState().recipes.entities).find((r) => r.name === "Stew").id;

describe("generateShoppingList", () => {
  it("replace builds combined items and reports prechecked staples", () => {
    const store = make();
    store.dispatch(addStaple("salt"));
    store.dispatch(addRecipeToMenu({ recipeId: soupId(store) }));
    store.dispatch(addRecipeToMenu({ recipeId: stewId(store), scale: 2 }));
    const result = store.dispatch(generateShoppingList("replace"));
    const items = selectShoppingItems(store.getState());
    expect(result.itemCount).toBe(2);
    expect(result.prechecked).toEqual([{ name: "Salt", quantityText: "1", unit: "tsp" }]);
    const onion = items.find((i) => i.nameKey === "onion");
    expect(onion.quantityText).toBe("5");
    expect(onion.contributions).toHaveLength(2);
    expect(items.find((i) => i.nameKey === "salt")).toMatchObject({ checked: true, isStaple: true });
  });

  it("merge is idempotent and picks up scale changes", () => {
    const store = make();
    store.dispatch(addRecipeToMenu({ recipeId: soupId(store) }));
    store.dispatch(generateShoppingList("replace"));
    const first = selectShoppingItems(store.getState()).find((i) => i.nameKey === "onion");
    store.dispatch(toggleItemChecked(first.id));
    store.dispatch(generateShoppingList("merge"));
    let onion = selectShoppingItems(store.getState()).find((i) => i.nameKey === "onion");
    expect(onion.quantityText).toBe("1");
    expect(onion.checked).toBe(true);
    store.dispatch(setMenuEntryScale({ entryId: "entry-1", scale: 3 }));
    store.dispatch(generateShoppingList("merge"));
    onion = selectShoppingItems(store.getState()).find((i) => i.nameKey === "onion");
    expect(onion.quantityText).toBe("3");
  });
});

describe("addItemsToShoppingList", () => {
  it("adds manual items with staple flag and returns count", () => {
    const store = make();
    store.dispatch(addStaple("salt"));
    const n = store.dispatch(addItemsToShoppingList([
      { name: "Salt", quantityUnit: 1, unit: "tsp", category: "" },
      { name: "Rice", quantityUnit: undefined, unit: "", category: "Grains" },
      { name: "  ", quantityUnit: "1" },
    ]));
    expect(n).toEqual({ added: 2, skipped: 0 });
    const items = selectShoppingItems(store.getState());
    expect(items[0]).toMatchObject({ name: "Salt", quantityText: "1", isStaple: true, source: "finder", checked: false, mergeKey: "salt|tsp|n" });
    expect(items[1]).toMatchObject({ name: "Rice", quantityText: "", isStaple: false, mergeKey: "rice||b" });
  });

  it("skips ingredients already on the list (no duplicates on a second tap)", () => {
    const store = make();
    const carrots = [{ name: "Carrots", quantityUnit: "1", unit: "Lbs", category: "Produce" }];
    store.dispatch(addItemsToShoppingList(carrots));
    expect(store.dispatch(addItemsToShoppingList(carrots))).toEqual({ added: 0, skipped: 1 });
    expect(selectShoppingItems(store.getState())).toHaveLength(1);
  });
});

describe("finder items, removed portions, and Merge", () => {
  const { configureStore } = require("@reduxjs/toolkit");
  const rootReducer = require("../rootReducer").default;
  const { addRecipeToMenu } = require("../menuSlice");
  const { addRecipe } = require("../recipesSlice");
  const { removeContribution, deleteItem, toggleItemChecked, selectShoppingItems: items } = require("../shoppingListSlice");
  const { generateShoppingList: gen, addItemsToShoppingList: addMissing } = require("../thunks");

  const setup = () => {
    const store = configureStore({ reducer: rootReducer });
    const onion = (q) => [{ name: "Onion", quantityUnit: q, unit: "", note: "", category: "Produce" }];
    store.dispatch(addRecipe({ name: "Chili", ingredients: onion("2") }));
    store.dispatch(addRecipe({ name: "Soup", ingredients: onion("1") }));
    store.dispatch(addRecipe({ name: "Stew", ingredients: onion("3") }));
    const [chili, soup, stew] = store.getState().recipes.ids.slice(-3);
    return { store, chili, soup, stew };
  };
  const onionItems = (store) => items(store.getState()).filter((i) => i.nameKey === "onion");

  it("a removed portion stays removed after Merge; new recipes still add", () => {
    const { store, chili, soup, stew } = setup();
    store.dispatch(addRecipeToMenu({ recipeId: chili }));
    store.dispatch(addRecipeToMenu({ recipeId: soup }));
    store.dispatch(gen("replace"));
    const [item] = onionItems(store);
    const chiliEntry = item.contributions.find((c) => c.recipeName === "Chili").menuEntryId;
    store.dispatch(removeContribution({ itemId: item.id, menuEntryId: chiliEntry })); // substituting shallots
    store.dispatch(toggleItemChecked(item.id));
    store.dispatch(gen("merge"));
    expect(onionItems(store)[0]).toMatchObject({ quantityText: "1", checked: true });
    store.dispatch(addRecipeToMenu({ recipeId: stew }));
    store.dispatch(gen("merge"));
    expect(onionItems(store)[0].quantityText).toBe("4"); // Soup 1 + Stew 3, Chili still excluded
  });

  it("a deleted menu line is not re-added by Merge; Replace starts fresh", () => {
    const { store, chili } = setup();
    store.dispatch(addRecipeToMenu({ recipeId: chili }));
    store.dispatch(gen("replace"));
    store.dispatch(deleteItem(onionItems(store)[0].id));
    store.dispatch(gen("merge"));
    expect(onionItems(store)).toHaveLength(0);
    store.dispatch(gen("replace"));
    expect(onionItems(store)).toHaveLength(1);
  });

  it("an 'Add missing' item becomes the menu line when that recipe is planned", () => {
    const { store, chili } = setup();
    store.dispatch(addMissing([{ name: "Onion", quantityUnit: "2", unit: "", category: "Produce" }]));
    store.dispatch(addRecipeToMenu({ recipeId: chili }));
    store.dispatch(gen("merge"));
    const lines = onionItems(store);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ source: "menu", quantityText: "2" });
    expect(lines[0].contributions).toHaveLength(1);
  });
});

describe("new week does not corrupt an existing list", () => {
  const { configureStore } = require("@reduxjs/toolkit");
  const rootReducer = require("../rootReducer").default;
  const { addRecipeToMenu, clearMenu } = require("../menuSlice");
  const { addRecipe } = require("../recipesSlice");
  const { toggleItemChecked, selectShoppingItems } = require("../shoppingListSlice");
  const { generateShoppingList: gen } = require("../thunks");

  it("Clear everything then Merge adds next week's onion instead of overwriting", () => {
    const store = configureStore({ reducer: rootReducer });
    store.dispatch(addRecipe({ name: "Chili", ingredients: [{ name: "Onion", quantityUnit: "2", unit: "", note: "", category: "Produce" }] }));
    store.dispatch(addRecipe({ name: "Soup", ingredients: [{ name: "Onion", quantityUnit: "1", unit: "", note: "", category: "Produce" }] }));
    const ids = store.getState().recipes.ids;
    const [chili, soup] = ids.slice(-2);
    store.dispatch(addRecipeToMenu({ recipeId: chili }));
    store.dispatch(gen("replace"));
    const onion = () => selectShoppingItems(store.getState()).find((i) => i.nameKey === "onion");
    store.dispatch(toggleItemChecked(onion().id));
    store.dispatch(clearMenu());
    store.dispatch(addRecipeToMenu({ recipeId: soup }));
    store.dispatch(gen("merge"));
    expect(onion().quantityText).toBe("3");
    expect(onion().contributions).toHaveLength(2);
    expect(onion().checked).toBe(false);
  });
});
