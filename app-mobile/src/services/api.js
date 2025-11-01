import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - should be from environment config
const BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh: refreshToken,
        });

        const { token } = response.data;
        await AsyncStorage.setItem('auth_token', token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============== AUTH ENDPOINTS ==============

export const login = (email, password) => {
  return apiClient.post('/auth/login', { email, password });
};

export const logout = () => {
  return apiClient.post('/auth/logout');
};

export const refreshToken = (refresh) => {
  return apiClient.post('/auth/refresh', { refresh });
};

// ============== PRODUCTS ENDPOINTS ==============

export const getProducts = (params = {}) => {
  return apiClient.get('/products/', { params });
};

export const getProductById = (id) => {
  return apiClient.get(`/products/${id}`);
};

export const getProductByBarcode = (barcode) => {
  return apiClient.get(`/products/by_barcode/${barcode}`);
};

export const searchProducts = (query) => {
  return apiClient.get('/products/', { params: { search: query } });
};

export const createProduct = (data) => {
  return apiClient.post('/products/', data);
};

export const updateProduct = (id, data) => {
  return apiClient.put(`/products/${id}`, data);
};

export const deleteProduct = (id) => {
  return apiClient.delete(`/products/${id}`);
};

// ============== INVENTORY ENDPOINTS ==============

export const getInventory = () => {
  return apiClient.get('/inventory/');
};

export const getInventoryByProduct = (productId) => {
  return apiClient.get(`/inventory/by_product/${productId}`);
};

export const adjustInventory = (data) => {
  return apiClient.post('/inventory/adjust', data);
};

export const getLowStock = () => {
  return apiClient.get('/inventory/low_stock');
};

// ============== CATEGORIES ENDPOINTS ==============

export const getCategories = () => {
  return apiClient.get('/categories/');
};

export const getCategoryById = (id) => {
  return apiClient.get(`/categories/${id}`);
};

// ============== CUSTOMERS ENDPOINTS ==============

export const searchCustomers = (query) => {
  return apiClient.get('/customers/', { params: { search: query } });
};

export const getCustomerById = (id) => {
  return apiClient.get(`/customers/${id}`);
};

export const createCustomer = (data) => {
  return apiClient.post('/customers/', data);
};

export const updateCustomer = (id, data) => {
  return apiClient.put(`/customers/${id}`, data);
};

// ============== TRANSACTIONS ENDPOINTS ==============

export const getTransactions = (params = {}) => {
  return apiClient.get('/transactions/', { params });
};

export const getTransactionById = (id) => {
  return apiClient.get(`/transactions/${id}`);
};

// ============== DEVICES ENDPOINTS (for push notifications) ==============

export const registerDevice = (data) => {
  return apiClient.post('/devices/', data);
};

export const updateDevice = (id, data) => {
  return apiClient.put(`/devices/${id}`, data);
};

// ============== DASHBOARD/STATS ENDPOINTS ==============

export const getDashboardStats = () => {
  return apiClient.get('/dashboard/stats');
};

export const getRecentActivity = () => {
  return apiClient.get('/inventory/recent');
};

// Export default API object
export default {
  login,
  logout,
  refreshToken,
  getProducts,
  getProductById,
  getProductByBarcode,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventory,
  getInventoryByProduct,
  adjustInventory,
  getLowStock,
  getCategories,
  getCategoryById,
  searchCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getTransactions,
  getTransactionById,
  registerDevice,
  updateDevice,
  getDashboardStats,
  getRecentActivity,
};
