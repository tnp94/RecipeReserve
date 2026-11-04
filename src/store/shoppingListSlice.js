import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { computeQuantityText, mergeItem } from "../domain/shoppingList";
import { normalizeName } from "../domain/ingredientKey";
import { addStaple, removeStaple } from "./pantrySlice";

const itemsAdapter = createEntityAdapter();

export const initialState = itemsAdapter.getInitialState({ nextId: 1 });

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
      } = action.payload;
      const trimmed = String(name ?? "").trim();
      if (!trimmed) return;
      addWithNewId(state, {
        mergeKey: null,
        nameKey: normalizeName(trimmed),
        name: trimmed,
        unit,
        category,
        quantityText,
        checked: false,
        isStaple: Boolean(isStaple),
        source: "manual",
        contributions: [],
      });
    },
    deleteItem: (state, action) => {
      itemsAdapter.removeOne(state, action.payload);
    },
    toggleItemChecked: (state, action) => {
      const item = state.entities[action.payload];
      if (item) item.checked = !item.checked;
    },
    clearShoppingList: () => initialState,
    replaceMenuItems: (state, action) => {
      itemsAdapter.removeAll(state);
      action.payload.forEach((built) => addWithNewId(state, built));
    },
    mergeMenuItems: (state, action) => {
      action.payload.forEach((built) => {
        const existingId = state.ids.find((id) => {
          const item = state.entities[id];
          return item.source === "menu" && item.mergeKey === built.mergeKey;
        });
        if (existingId !== undefined) {
          state.entities[existingId] = mergeItem(state.entities[existingId], built);
        } else {
          addWithNewId(state, built);
        }
      });
    },
    removeContribution: (state, action) => {
      const { itemId, menuEntryId } = action.payload;
      const item = state.entities[itemId];
      if (!item) return;
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
  toggleItemChecked,
  clearShoppingList,
  replaceMenuItems,
  mergeMenuItems,
  removeContribution,
} = shoppingListSlice.actions;

const selectors = itemsAdapter.getSelectors((state) => state.shoppingList);
export const selectShoppingItems = selectors.selectAll;
export const selectShoppingItemCount = selectors.selectTotal;

export default shoppingListSlice.reducer;
