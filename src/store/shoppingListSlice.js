import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { computeQuantityText, mergeItem, withoutEntries } from "../domain/shoppingList";
import { normalizeName } from "../domain/ingredientKey";
import { addStaple, removeStaple } from "./pantrySlice";

const itemsAdapter = createEntityAdapter();

// `removed[mergeKey]` = menu entries whose portion the user removed (or whose line they
// deleted), so a later Merge doesn't silently add them back. Cleared by Replace/Clear.
export const initialState = itemsAdapter.getInitialState({ nextId: 1, removed: {} });

function rememberRemoved(state, mergeKey, entryIds) {
  if (!mergeKey || entryIds.length === 0) return;
  if (!state.removed) state.removed = {};
  const list = state.removed[mergeKey] ?? [];
  for (const id of entryIds) if (!list.includes(id)) list.push(id);
  state.removed[mergeKey] = list;
}

function addWithNewId(state, item) {
  const id = `item-${state.nextId}`;
  state.nextId += 1;
  itemsAdapter.addOne(state, { ...item, id });
}

function setStapleFlag(state, nameKey, value) {
  state.ids.forEach((id) => {
    if (state.entities[id].nameKey === nameKey) state.entities[id].isStaple = value;
  });
}

const shoppingListSlice = createSlice({
  name: "shoppingList",
  initialState,
  reducers: {
    addManualItem: (state, action) => {
      const {
        name,
        quantityText = "",
        unit = "",
        category = "",
        isStaple = false,
        // "finder" items (from "Add missing") carry a merge key so that putting the recipe
        // on the menu later turns them into that menu line instead of a duplicate.
        source = "manual",
        mergeKey = null,
        contributions = [],
      } = action.payload;
      const trimmed = String(name ?? "").trim();
      if (!trimmed) return;
      addWithNewId(state, {
        mergeKey: source === "finder" ? mergeKey : null,
        nameKey: normalizeName(trimmed),
        name: trimmed,
        unit,
        category,
        quantityText,
        checked: false,
        isStaple: Boolean(isStaple),
        source: source === "finder" ? "finder" : "manual",
        contributions: source === "finder" ? contributions : [],
      });
    },
    deleteItem: (state, action) => {
      const item = state.entities[action.payload];
      if (item && item.source === "menu") rememberRemoved(state, item.mergeKey, item.contributions.map((c) => c.menuEntryId));
      itemsAdapter.removeOne(state, action.payload);
    },
    // "Clear checked": removes every ticked-off line. Like deleteItem, a menu line's
    // portions are remembered as removed, so a later Merge doesn't add bought items back.
    deleteCheckedItems: (state) => {
      const doomed = state.ids.filter((id) => state.entities[id].checked);
      doomed.forEach((id) => {
        const item = state.entities[id];
        if (item.source === "menu") rememberRemoved(state, item.mergeKey, item.contributions.map((c) => c.menuEntryId));
      });
      itemsAdapter.removeMany(state, doomed);
    },
    toggleItemChecked: (state, action) => {
      const item = state.entities[action.payload];
      if (item) item.checked = !item.checked;
    },
    clearShoppingList: () => initialState,
    replaceMenuItems: (state, action) => {
      itemsAdapter.removeAll(state);
      state.removed = {};
      action.payload.forEach((built) => addWithNewId(state, built));
    },
    mergeMenuItems: (state, action) => {
      action.payload.forEach((rawBuilt) => {
        const built = withoutEntries(rawBuilt, state.removed?.[rawBuilt.mergeKey]);
        if (!built) return; // every portion of this line was removed by the user
        const existingId = state.ids.find((id) => {
          const item = state.entities[id];
          return (item.source === "menu" || item.source === "finder") && item.mergeKey === built.mergeKey;
        });
        if (existingId !== undefined) {
          state.entities[existingId] = { ...mergeItem(state.entities[existingId], built), source: "menu" };
        } else {
          addWithNewId(state, built);
        }
      });
    },
    removeContribution: (state, action) => {
      const { itemId, menuEntryId } = action.payload;
      const item = state.entities[itemId];
      if (!item) return;
      if (!item.contributions.some((c) => c.menuEntryId === menuEntryId)) return;
      rememberRemoved(state, item.mergeKey, [menuEntryId]);
      item.contributions = item.contributions.filter((c) => c.menuEntryId !== menuEntryId);
      if (item.contributions.length === 0) {
        itemsAdapter.removeOne(state, itemId);
      } else {
        item.quantityText = computeQuantityText(item.contributions);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addStaple, (state, action) => {
        setStapleFlag(state, normalizeName(action.payload ?? ""), true);
      })
      .addCase(removeStaple, (state, action) => {
        setStapleFlag(state, action.payload, false);
      });
  },
});

export const {
  addManualItem,
  deleteItem,
  deleteCheckedItems,
  toggleItemChecked,
  clearShoppingList,
  replaceMenuItems,
  mergeMenuItems,
  removeContribution,
} = shoppingListSlice.actions;

const selectors = itemsAdapter.getSelectors((state) => state.shoppingList);
export const selectShoppingItems = selectors.selectAll;
export const selectShoppingItemCount = selectors.selectTotal;
export const selectUncheckedItemCount = (state) =>
  state.shoppingList.ids.reduce((n, id) => (state.shoppingList.entities[id].checked ? n : n + 1), 0);

export default shoppingListSlice.reducer;
