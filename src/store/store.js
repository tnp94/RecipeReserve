import { configureStore } from "@reduxjs/toolkit";
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
import rootReducer from './rootReducer'
import { migrations } from './migrations'
import AsyncStorage from "@react-native-async-storage/async-storage";

const persistConfig = {
  key: 'root',
  version: 3,
  storage: AsyncStorage,
  migrate: createMigrate(migrations, { debug: false }),
};

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
