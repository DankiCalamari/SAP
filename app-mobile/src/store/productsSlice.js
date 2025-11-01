import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { getProducts as getProductsFromDB, insertProducts } from '../database/operations';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ filters = {}, offline = false }, { rejectWithValue }) => {
    try {
      if (offline) {
        // Fetch from local SQLite database
        const products = await getProductsFromDB(filters);
        return { products, offline: true };
      } else {
        // Fetch from API
        const response = await api.getProducts(filters);
        const products = response.data.results || response.data;

        // Store in local database for offline access
        await insertProducts(products);

        return { products, offline: false };
      }
    } catch (error) {
      // If API fails, try to load from local database
      try {
        const products = await getProductsFromDB(filters);
        return { products, offline: true };
      } catch (dbError) {
        return rejectWithValue('Failed to load products');
      }
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.getProductById(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to load product details');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.searchProducts(query);
      return response.data.results || response.data;
    } catch (error) {
      return rejectWithValue('Search failed');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    selectedProduct: null,
    loading: false,
    error: null,
    filters: {
      category: null,
      stockStatus: null,
      sortBy: 'name_asc',
    },
    offline: false,
  },
  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload;
    },
    addProduct: (state, action) => {
      state.items.push(action.payload);
    },
    updateProduct: (state, action) => {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.offline = action.payload.offline;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setProducts,
  addProduct,
  updateProduct,
  setFilters,
  clearSelectedProduct,
  clearError,
} = productsSlice.actions;

export default productsSlice.reducer;
