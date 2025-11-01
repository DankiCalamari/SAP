import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { addToSyncQueue } from '../database/operations';

// Async thunks
export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getInventory();
      return response.data.results || response.data;
    } catch (error) {
      return rejectWithValue('Failed to load inventory');
    }
  }
);

export const fetchInventoryByProduct = createAsyncThunk(
  'inventory/fetchInventoryByProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.getInventoryByProduct(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to load product inventory');
    }
  }
);

export const submitAdjustment = createAsyncThunk(
  'inventory/submitAdjustment',
  async ({ productId, quantity, reason, notes, offline = false }, { rejectWithValue }) => {
    try {
      if (offline) {
        // Queue for later sync
        await addToSyncQueue('inventory_adjust', {
          product_id: productId,
          quantity,
          reason,
          notes,
        });
        return { queued: true, productId, quantity, reason, notes };
      } else {
        // Submit immediately
        const response = await api.adjustInventory({
          product_id: productId,
          quantity,
          reason,
          notes,
        });
        return response.data;
      }
    } catch (error) {
      // If online submission fails, queue it
      await addToSyncQueue('inventory_adjust', {
        product_id: productId,
        quantity,
        reason,
        notes,
      });
      return { queued: true, productId, quantity, reason, notes };
    }
  }
);

export const fetchLowStock = createAsyncThunk(
  'inventory/fetchLowStock',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getLowStock();
      return response.data.results || response.data;
    } catch (error) {
      return rejectWithValue('Failed to load low stock items');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    adjustments: [],
    lowStockItems: [],
    currentInventory: null,
    loading: false,
    error: null,
  },
  reducers: {
    setAdjustments: (state, action) => {
      state.adjustments = action.payload;
    },
    addAdjustment: (state, action) => {
      state.adjustments.unshift(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch inventory
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.adjustments = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch inventory by product
      .addCase(fetchInventoryByProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryByProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInventory = action.payload;
      })
      .addCase(fetchInventoryByProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit adjustment
      .addCase(submitAdjustment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitAdjustment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.queued) {
          // Add to local adjustments list with queued flag
          state.adjustments.unshift({
            ...action.payload,
            status: 'queued',
            created_at: new Date().toISOString(),
          });
        } else {
          state.adjustments.unshift(action.payload);
        }
      })
      .addCase(submitAdjustment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch low stock
      .addCase(fetchLowStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLowStock.fulfilled, (state, action) => {
        state.loading = false;
        state.lowStockItems = action.payload;
      })
      .addCase(fetchLowStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setAdjustments, addAdjustment, clearError } = inventorySlice.actions;
export default inventorySlice.reducer;
