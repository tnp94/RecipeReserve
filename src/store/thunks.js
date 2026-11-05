import { buildShoppingItems, finderContribution, mergeKeyFor, withoutEntries } from "../domain/shoppingList";
import { normalizeName, normalizeUnit } from "../domain/ingredientKey";
import { parseQuantity } from "../domain/quantity";
import { selectMenuEntries } from "./menuSlice";
import { selectStapleKeys } from "./pantrySlice";
import {
  replaceMenuItems,
  mergeMenuItems,
  addManualItem,
  selectShoppingItems,
} from "./shoppingListSlice";

export const generateShoppingList = (mode) => (dispatch, getState) => {
  const state = getState();
  const built = buildShoppingItems({
    entries: selectMenuEntries(state),
    recipesById: state.recipes.entities,
    stapleKeys: selectStapleKeys(state),
  });
  // Merge skips portions the user removed earlier; filter here too so the staple
  // reminder only lists what is actually added.
  const removed = state.shoppingList.removed ?? {};
  const builtItems = mode === "merge" ? built.map((b) => withoutEntries(b, removed[b.mergeKey])).filter(Boolean) : built;
  dispatch(mode === "merge" ? mergeMenuItems(builtItems) : replaceMenuItems(builtItems));
  return {
    prechecked: builtItems
      .filter((i) => i.isStaple)
      .map((i) => ({ name: i.name, quantityText: i.quantityText, unit: i.unit })),
  };
};

// Adds recipe ingredients (the finder's "Add missing" for `recipe`) to the list. Skips
// anything already on the list by name, so tapping twice doesn't duplicate. Each item
// remembers which recipe it is for, so planning that recipe later replaces the amount
// while other recipes add to it. Returns { added, skipped }.
export const addItemsToShoppingList = (ingredients, recipe = null) => (dispatch, getState) => {
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
    const quantity = parseQuantity(quantityText);
    dispatch(
      addManualItem({
        name,
        quantityText,
        unit,
        category: ingredient.category ?? "",
        isStaple: stapleKeys.has(nameKey),
        source: "finder",
        mergeKey: mergeKeyFor(nameKey, normalizeUnit(unit), quantity),
        contributions: recipe ? [finderContribution(recipe.id, recipe.name, quantity, String(ingredient.note ?? "").trim())] : [],
      })
    );
    added += 1;
  }
  return { added, skipped };
};
