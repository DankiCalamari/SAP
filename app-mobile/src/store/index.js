import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import productsReducer from './productsSlice';
import inventoryReducer from './inventorySlice';
import syncReducer from './syncSlice';
import settingsReducer from './settingsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    inventory: inventoryReducer,
    sync: syncReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/loginUser/fulfilled', 'auth/logoutUser/fulfilled'],
      },
    }),
});

export default store;
