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
    expect(n).toBe(2);
    const items = selectShoppingItems(store.getState());
    expect(items[0]).toMatchObject({ name: "Salt", quantityText: "1", isStaple: true, source: "manual", checked: false });
    expect(items[1]).toMatchObject({ name: "Rice", quantityText: "", isStaple: false });
  });
});
