import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSyncQueue, markAsSynced } from '../database/operations';
import api from '../services/api';

// Async thunks
export const processQueue = createAsyncThunk(
  'sync/processQueue',
  async (_, { rejectWithValue }) => {
    try {
      const queue = await getSyncQueue();

      if (queue.length === 0) {
        return { processed: 0, failed: 0 };
      }

      let processed = 0;
      let failed = 0;

      for (const item of queue) {
        try {
          const payload = JSON.parse(item.payload);

          switch (item.action_type) {
            case 'inventory_adjust':
              await api.adjustInventory(payload);
              break;
            case 'customer_create':
              await api.createCustomer(payload);
              break;
            default:
              console.warn('Unknown action type:', item.action_type);
          }

          await markAsSynced(item.id);
          processed++;
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
          failed++;
        }
      }

      const lastSyncTime = new Date().toISOString();
      await AsyncStorage.setItem('last_sync_time', lastSyncTime);

      return { processed, failed, lastSync: lastSyncTime };
    } catch (error) {
      return rejectWithValue('Queue processing failed');
    }
  }
);

export const loadQueueCount = createAsyncThunk(
  'sync/loadQueueCount',
  async (_, { rejectWithValue }) => {
    try {
      const queue = await getSyncQueue();
      return queue.length;
    } catch (error) {
      return rejectWithValue('Failed to load queue count');
    }
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    queue: [],
    queueCount: 0,
    lastSync: null,
    syncing: false,
    error: null,
  },
  reducers: {
    addToQueue: (state, action) => {
      state.queue.push(action.payload);
      state.queueCount += 1;
    },
    removeFromQueue: (state, action) => {
      state.queue = state.queue.filter(item => item.id !== action.payload);
      state.queueCount = Math.max(0, state.queueCount - 1);
    },
    setSyncing: (state, action) => {
      state.syncing = action.payload;
    },
    setLastSync: (state, action) => {
      state.lastSync = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Process queue
      .addCase(processQueue.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(processQueue.fulfilled, (state, action) => {
        state.syncing = false;
        state.queueCount = Math.max(0, state.queueCount - action.payload.processed);
        state.lastSync = action.payload.lastSync;
      })
      .addCase(processQueue.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      })
      // Load queue count
      .addCase(loadQueueCount.fulfilled, (state, action) => {
        state.queueCount = action.payload;
      });
  },
});

export const {
  addToQueue,
  removeFromQueue,
  setSyncing,
  setLastSync,
  clearError,
} = syncSlice.actions;

export default syncSlice.reducer;
