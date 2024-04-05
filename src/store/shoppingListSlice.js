import { createSlice } from "@reduxjs/toolkit";
import storage from "../Storage";

const initialState = []
// console.log(initialState);

const shoppingListSlice = createSlice({
  name: "shoppingList",
  initialState: initialState,
  reducers: {
    addItem: (state, action) => {
      state.push(action.payload)
    },
    deleteItem: (state, action) => {
      state.splice(action.payload, 1)
    },
    clearShoppingList: (state, action) => {
      return initialState
    },
    generateShoppingList: (state, action) => {
      const shoppingList = []
      action.payload.forEach((recipe, recipeIndex) => {
        recipe.ingredients.forEach((ingredient, index) => {
          shoppingList.push({...ingredient, checked: false, id: {recipeIndex, index}})
        })
      });
      shoppingList.sort((a, b) => a.name.localeCompare(b.name))
      return shoppingList
    },
    checkOffShoppingItem: (state, action) => {
      var checkedIndex = state.findIndex((item, index) => {
        return (item.id.recipeIndex == action.payload.recipeIndex && item.id.index == action.payload.index)
      })
      if (checkedIndex >= 0) {
        state[checkedIndex].checked = !state[checkedIndex].checked
      }
    }
  }
})

export const { addItem, deleteItem, clearShoppingList, generateShoppingList, checkOffShoppingItem } = shoppingListSlice.actions;

export default shoppingListSlice.reducer;