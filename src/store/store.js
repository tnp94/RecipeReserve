import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import recipesReducer, { initialState as recipesInitialState } from './recipesSlice'
import shoppingListReducer from './shoppingListSlice'
import menuReducer from './menuSlice'
import AsyncStorage from "@react-native-async-storage/async-storage";

const migrations = {
  1: (state) => ({
    ...state,
    recipes: recipesInitialState,
  }),
};

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  migrate: createMigrate(migrations, { debug: false }),
};

const rootReducer = combineReducers({
  recipes: recipesReducer,
  shoppingList: shoppingListReducer,
  menu: menuReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)
