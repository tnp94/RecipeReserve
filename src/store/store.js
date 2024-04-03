import { configureStore } from "@reduxjs/toolkit";
import recipeListReducer from './recipeListSlice'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
  key: 'root',
  storage: AsyncStorage
}
const persistedReducer = persistReducer(persistConfig, recipeListReducer)

export const store = configureStore({
  reducer: persistedReducer
})

export const persistor = persistStore(store)