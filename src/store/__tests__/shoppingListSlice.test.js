import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../rootReducer";
import {
  addManualItem, deleteItem, toggleItemChecked, clearShoppingList, replaceMenuItems,
  mergeMenuItems, removeContribution, selectShoppingItems, selectShoppingItemCount,
  deleteCheckedItems, selectUncheckedItemCount,
} from "../shoppingListSlice";
import { addStaple, removeStaple, toggleStaple } from "../pantrySlice";

const make = () => configureStore({ reducer: rootReducer });
const contrib = (id, text, n) => ({
  menuEntryId: id, recipeId: 1, recipeName: "R", scale: 1,
  quantity: { kind: "number", min: n, max: n }, quantityText: text, note: "",
});
const built = (contributions, over = {}) => ({
  mergeKey: "onion||n", nameKey: "onion", name: "Onion", unit: "", category: "",
  contributions, quantityText: String(contributions.reduce((a, c) => a + c.quantity.min, 0)),
  isStaple: false, checked: false, source: "menu", ...over,
});

describe("shoppingListSlice", () => {
  it("deleteCheckedItems removes only checked lines; selectUncheckedItemCount counts the rest", () => {
    const store = make();
    store.dispatch(addManualItem({ name: "A" }));
    store.dispatch(addManualItem({ name: "B" }));
    store.dispatch(addManualItem({ name: "C" }));
    store.dispatch(toggleItemChecked("item-1"));
    store.dispatch(toggleItemChecked("item-3"));
    expect(selectUncheckedItemCount(store.getState())).toBe(1);
    store.dispatch(deleteCheckedItems());
    expect(selectShoppingItems(store.getState()).map((i) => i.name)).toEqual(["B"]);
    expect(selectUncheckedItemCount(store.getState())).toBe(1);
  });

  it("deleteCheckedItems remembers removed menu portions so Merge doesn't add bought items back", () => {
    const store = make();
    store.dispatch(replaceMenuItems([built([contrib("entry-1", "1", 1)])]));
    store.dispatch(toggleItemChecked("item-1"));
    store.dispatch(deleteCheckedItems());
    expect(selectShoppingItemCount(store.getState())).toBe(0);
    expect(store.getState().shoppingList.removed["onion||n"]).toEqual(["entry-1"]);
    store.dispatch(mergeMenuItems([built([contrib("entry-1", "1", 1)])]));
    expect(selectShoppingItemCount(store.getState())).toBe(0);
    // A recipe added to the menu later still comes through.
    store.dispatch(mergeMenuItems([built([contrib("entry-1", "1", 1), contrib("entry-2", "2", 2)])]));
    expect(selectShoppingItems(store.getState()).map((i) => i.quantityText)).toEqual(["2"]);
  });

  it("adds manual items and ignores blank names", () => {
    const store = make();
    store.dispatch(addManualItem({ name: "  " }));
    store.dispatch(addManualItem({ name: " Milk ", quantityText: "2", unit: "L" }));
    const items = selectShoppingItems(store.getState());
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "item-1", mergeKey: null, nameKey: "milk", name: "Milk", quantityText: "2",
      unit: "L", checked: false, isStaple: false, source: "manual", contributions: [],
    });
  });

  it("toggles, deletes, clears", () => {
    const store = make();
    store.dispatch(addManualItem({ name: "A" }));
    store.dispatch(addManualItem({ name: "B" }));
    store.dispatch(toggleItemChecked("item-1"));
    expect(store.getState().shoppingList.entities["item-1"].checked).toBe(true);
    store.dispatch(deleteItem("item-2"));
    expect(selectShoppingItemCount(store.getState())).toBe(1);
    store.dispatch(clearShoppingList());
    expect(selectShoppingItemCount(store.getState())).toBe(0);
    expect(store.getState().shoppingList.nextId).toBe(1);
  });

  it("replaceMenuItems clears manual items and assigns ids", () => {
    const store = make();
    store.dispatch(addManualItem({ name: "Manual" }));
    store.dispatch(replaceMenuItems([built([contrib("entry-1", "1", 1)])]));
    const items = selectShoppingItems(store.getState());
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("item-2");
    expect(items[0].source).toBe("menu");
  });

  it("mergeMenuItems is idempotent for the same entry, adds and unchecks on new entry", () => {
    const store = make();
    store.dispatch(replaceMenuItems([built([contrib("entry-1", "1", 1)])]));
    store.dispatch(toggleItemChecked("item-1"));
    store.dispatch(mergeMenuItems([built([contrib("entry-1", "1", 1)])]));
    let item = store.getState().shoppingList.entities["item-1"];
    expect(item.quantityText).toBe("1");
    expect(item.checked).toBe(true);
    store.dispatch(mergeMenuItems([built([contrib("entry-1", "1", 1), contrib("entry-2", "1", 1)])]));
    item = store.getState().shoppingList.entities["item-1"];
    expect(item.quantityText).toBe("2");
    expect(item.checked).toBe(false);
    store.dispatch(mergeMenuItems([built([contrib("entry-3", "1", 1)], { mergeKey: "x||n", nameKey: "x", name: "X" })]));
    expect(selectShoppingItemCount(store.getState())).toBe(2);
    expect(store.getState().shoppingList.ids).toEqual(["item-1", "item-2"]);
  });

  it("does not merge into manual items with the same key", () => {
    const store = make();
    store.dispatch(addManualItem({ name: "Onion" }));
    store.dispatch(mergeMenuItems([built([contrib("entry-1", "1", 1)])]));
    expect(selectShoppingItemCount(store.getState())).toBe(2);
  });

  it("removeContribution recomputes text and deletes the item when empty", () => {
    const store = make();
    store.dispatch(replaceMenuItems([built([contrib("entry-1", "1", 1), contrib("entry-2", "2", 2)])]));
    store.dispatch(removeContribution({ itemId: "item-1", menuEntryId: "entry-2" }));
    expect(store.getState().shoppingList.entities["item-1"].quantityText).toBe("1");
    store.dispatch(removeContribution({ itemId: "item-1", menuEntryId: "entry-1" }));
    expect(selectShoppingItemCount(store.getState())).toBe(0);
  });

  it("pantry actions set isStaple without changing checked", () => {
    const store = make();
    store.dispatch(replaceMenuItems([built([contrib("entry-1", "1", 1)])]));
    store.dispatch(addManualItem({ name: "Onions" }));
    store.dispatch(toggleItemChecked("item-1"));
    store.dispatch(addStaple("onion"));
    let e = store.getState().shoppingList.entities;
    expect(e["item-1"]).toMatchObject({ isStaple: true, checked: true });
    expect(e["item-2"]).toMatchObject({ isStaple: true, checked: false });
    store.dispatch(removeStaple("onion"));
    e = store.getState().shoppingList.entities;
    expect(e["item-1"]).toMatchObject({ isStaple: false, checked: true });
    store.dispatch(toggleStaple("Onion"));
    expect(store.getState().shoppingList.entities["item-2"].isStaple).toBe(true);
    store.dispatch(toggleStaple("Onion"));
    expect(store.getState().shoppingList.entities["item-2"].isStaple).toBe(false);
  });
});
