import { buildShoppingItems } from "../domain/shoppingList";
import { normalizeName } from "../domain/ingredientKey";
import { selectMenuEntries } from "./menuSlice";
import { selectStapleKeys } from "./pantrySlice";
import {
  replaceMenuItems,
  mergeMenuItems,
  addManualItem,
} from "./shoppingListSlice";

export const generateShoppingList = (mode) => (dispatch, getState) => {
  const state = getState();
  const builtItems = buildShoppingItems({
    entries: selectMenuEntries(state),
    recipesById: state.recipes.entities,
    stapleKeys: selectStapleKeys(state),
  });
  dispatch(mode === "merge" ? mergeMenuItems(builtItems) : replaceMenuItems(builtItems));
  return {
    itemCount: builtItems.length,
    prechecked: builtItems
      .filter((i) => i.isStaple)
      .map((i) => ({ name: i.name, quantityText: i.quantityText, unit: i.unit })),
  };
};

export const addItemsToShoppingList = (ingredients) => (dispatch, getState) => {
  const stapleKeys = selectStapleKeys(getState());
  let added = 0;
  for (const ingredient of ingredients ?? []) {
    const name = String(ingredient?.name ?? "").trim();
    if (!name) continue;
    dispatch(
      addManualItem({
        name,
        quantityText: String(ingredient.quantityUnit ?? ""),
        unit: ingredient.unit ?? "",
        category: ingredient.category ?? "",
        isStaple: stapleKeys.has(normalizeName(name)),
      })
    );
    added += 1;
  }
  return added;
};
