import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  shoppingList: {},
  itemID: 0
}
// console.log(initialState);

const shoppingListSlice = createSlice({
  name: "shoppingList",
  initialState: initialState,
  reducers: {
    addItem: (state, action) => {
      state.shoppingList[state.itemID] = action.payload
      state.itemID += 1
    },
    deleteItem: (state, action) => {
      delete state.shoppingList[action.payload]
    },
    clearShoppingList: (state, action) => {
      return initialState
    },
    generateShoppingList: (state, action) => {
      var shoppingList = {}
      var itemID = 0
      Object.entries(action.payload).forEach(([index, recipe]) => {
        recipe.ingredients.forEach((ingredient) => {
          shoppingList[itemID] = {...ingredient, checked: false, id: itemID}
          itemID += 1;
        })
      });
      state.shoppingList = {...shoppingList};
      state.itemID= itemID
    },
    checkOffShoppingItem: (state, action) => {
      state.shoppingList[action.payload].checked = !state.shoppingList[action.payload].checked
    }
  }
})

export const { addItem, deleteItem, clearShoppingList, generateShoppingList, checkOffShoppingItem } = shoppingListSlice.actions;

export default shoppingListSlice.reducer;