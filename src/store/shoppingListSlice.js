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
      var mockMenu = [
        {
          ingredients: [
            {
              name: "Unsalted Butter (Softened)",
              unit: "Tbsp",
              quantityUnit: "4",
            },
            {
              name: "Carrots",
              unit: "Whole",
              quantityUnit: "2",
            },
          ]
        },
        {
          ingredients: [
            {
              name: "Unsalted Butter (Softened)",
              unit: "Tbsp",
              quantityUnit: "3/4",
            },
            {
              name: "Minced Fresh Chives",
              unit: "Tbsp",
              quantityUnit: "2",
            },
          ]
        },
        {
          ingredients: [
            {
              name: "Unsalted Butter (Softened)",
              unit: "Cup",
              quantityUnit: "2",
            },
          ]
        },
      ]
      const shoppingList = []
      action.payload.forEach((recipe) => {
        recipe.ingredients.forEach((ingredient) => {
          shoppingList.push(ingredient)
        })
      });
      console.log(shoppingList);
      shoppingList.sort((a, b) => a.name.localeCompare(b.name))
      return shoppingList
      // const shoppingList = new Map()
      // action.payload.forEach((recipe) => {
      //   console.log("IngredientsList:", recipe.ingredients);
      //   recipe.ingredients.forEach((ingredient) => {
      //     if (shoppingList.has(ingredient.name))
      //     {
      //       const shoppingItem = shoppingList.get(ingredient.name)
      //       if (shoppingItem.has(ingredient.unit))
      //       {
      //         shoppingItem.set(ingredient.unit, Number.parseFloat(shoppingItem.get(ingredient.unit)) + Number.parseFloat(ingredient.quantityUnit))
      //       }
      //       else
      //       {
      //         shoppingItem.set(ingredient.unit, Number.parseFloat(ingredient.quantityUnit))
      //       }
      //     }
      //     else {
      //       const shoppingItem = new Map([[ingredient.unit, Number.parseFloat(ingredient.quantityUnit)]])
      //       shoppingList.set(ingredient.name, shoppingItem)
      //     }
      //   })
      // })
      // shoppingList.forEach((value, key) => {
      //   shoppingList.set(key, Array.from(value.entries()))
      // })



      // console.log(Array.from(shoppingList.entries()));
      // return Array.from(shoppingList.entries())
    },
  }
})

export const { addItem, deleteItem, clearShoppingList, generateShoppingList } = shoppingListSlice.actions;

export default shoppingListSlice.reducer;