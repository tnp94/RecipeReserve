import { combineReducers } from "@reduxjs/toolkit";
import recipesReducer from "./recipesSlice";
import menuReducer from "./menuSlice";
import shoppingListReducer from "./shoppingListSlice";
import pantryReducer from "./pantrySlice";
import settingsReducer from "./settingsSlice";
import finderReducer from "./finderSlice";

const rootReducer = combineReducers({
  recipes: recipesReducer,
  menu: menuReducer,
  shoppingList: shoppingListReducer,
  pantry: pantryReducer,
  settings: settingsReducer,
  finder: finderReducer,
});

export default rootReducer;
