import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    offlineMode: true,
    notifications: {
      enabled: true,
      lowStock: true,
      inventoryUpdates: true,
      newProducts: true,
    },
    camera: {
      enabled: true,
    },
  },
  reducers: {
    toggleOfflineMode: (state, action) => {
      state.offlineMode = action.payload;
      AsyncStorage.setItem('offline_mode', JSON.stringify(action.payload));
    },
    setNotifications: (state, action) => {
      state.notifications = { ...state.notifications, ...action.payload };
      AsyncStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    toggleNotification: (state, action) => {
      const { key, value } = action.payload;
      state.notifications[key] = value;
      AsyncStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    loadSettings: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  toggleOfflineMode,
  setNotifications,
  toggleNotification,
  loadSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
