import { buildShoppingItems, mergeKeyFor } from "../domain/shoppingList";
import { normalizeName, normalizeUnit } from "../domain/ingredientKey";
import { parseQuantity } from "../domain/quantity";
import { selectShoppingItems } from "./shoppingListSlice";
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

// Adds recipe ingredients (the finder's "Add missing") to the list. Skips anything
// already on the list by name, so tapping twice doesn't duplicate. Returns
// { added, skipped }.
export const addItemsToShoppingList = (ingredients) => (dispatch, getState) => {
  const state = getState();
  const stapleKeys = selectStapleKeys(state);
  const onList = new Set(selectShoppingItems(state).map((i) => i.nameKey));
  let added = 0;
  let skipped = 0;
  for (const ingredient of ingredients ?? []) {
    const name = String(ingredient?.name ?? "").trim();
    if (!name) continue;
    const nameKey = normalizeName(name);
    if (onList.has(nameKey)) {
      skipped += 1;
      continue;
    }
    onList.add(nameKey);
    const unit = String(ingredient.unit ?? "").trim();
    const quantityText = String(ingredient.quantityUnit ?? "");
    dispatch(
      addManualItem({
        name,
        quantityText,
        unit,
        category: ingredient.category ?? "",
        isStaple: stapleKeys.has(nameKey),
        source: "finder",
        mergeKey: mergeKeyFor(nameKey, normalizeUnit(unit), parseQuantity(quantityText)),
      })
    );
    added += 1;
  }
  return { added, skipped };
};
