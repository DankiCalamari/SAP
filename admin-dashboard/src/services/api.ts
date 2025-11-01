import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  AuthResponse,
  User,
  Product,
  PaginatedResponse,
  Sale,
  Customer,
  Discount,
  InventoryItem,
  InventoryAdjustment,
  DashboardStats,
  SalesOverTimeData,
  TopProduct,
  CategorySales,
  Category,
  ProductFormData,
  DiscountFormData,
  UserFormData,
  StoreSettings,
} from '../types';

const BASE_URL = 'http://localhost:8000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('admin_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ============== AUTH ==============
  auth = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await this.client.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      return response.data;
    },

    logout: async (): Promise<void> => {
      await this.client.post('/auth/logout');
    },

    getCurrentUser: async (): Promise<User> => {
      const response = await this.client.get<User>('/auth/me');
      return response.data;
    },
  };

  // ============== PRODUCTS ==============
  products = {
    getAll: async (params?: any): Promise<PaginatedResponse<Product>> => {
      const response = await this.client.get<PaginatedResponse<Product>>('/products/', {
        params,
      });
      return response.data;
    },

    getById: async (id: number): Promise<Product> => {
      const response = await this.client.get<Product>(`/products/${id}`);
      return response.data;
    },

    create: async (data: ProductFormData): Promise<Product> => {
      const response = await this.client.post<Product>('/products/', data);
      return response.data;
    },

    update: async (id: number, data: Partial<ProductFormData>): Promise<Product> => {
      const response = await this.client.patch<Product>(`/products/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/products/${id}`);
    },

    bulkDelete: async (ids: number[]): Promise<void> => {
      await this.client.post('/products/bulk-delete', { ids });
    },
  };

  // ============== CATEGORIES ==============
  categories = {
    getAll: async (): Promise<Category[]> => {
      const response = await this.client.get<Category[]>('/categories/');
      return response.data;
    },

    getById: async (id: number): Promise<Category> => {
      const response = await this.client.get<Category>(`/categories/${id}`);
      return response.data;
    },
  };

  // ============== INVENTORY ==============
  inventory = {
    getAll: async (params?: any): Promise<PaginatedResponse<InventoryItem>> => {
      const response = await this.client.get<PaginatedResponse<InventoryItem>>(
        '/inventory/',
        { params }
      );
      return response.data;
    },

    getByProduct: async (productId: number): Promise<InventoryItem> => {
      const response = await this.client.get<InventoryItem>(
        `/inventory/by_product/${productId}`
      );
      return response.data;
    },

    adjust: async (data: {
      product_id: number;
      quantity: number;
      reason: string;
      notes?: string;
    }): Promise<InventoryAdjustment> => {
      const response = await this.client.post<InventoryAdjustment>(
        '/inventory/adjust',
        data
      );
      return response.data;
    },

    getLowStock: async (): Promise<Product[]> => {
      const response = await this.client.get<Product[]>('/inventory/low_stock');
      return response.data;
    },

    getAdjustments: async (params?: any): Promise<PaginatedResponse<InventoryAdjustment>> => {
      const response = await this.client.get<PaginatedResponse<InventoryAdjustment>>(
        '/inventory/adjustments',
        { params }
      );
      return response.data;
    },
  };

  // ============== SALES ==============
  sales = {
    getAll: async (params?: any): Promise<PaginatedResponse<Sale>> => {
      const response = await this.client.get<PaginatedResponse<Sale>>('/sales/', {
        params,
      });
      return response.data;
    },

    getById: async (id: number): Promise<Sale> => {
      const response = await this.client.get<Sale>(`/sales/${id}`);
      return response.data;
    },

    void: async (id: number, reason: string): Promise<void> => {
      await this.client.post(`/sales/${id}/void`, { reason });
    },

    exportCSV: async (params?: any): Promise<Blob> => {
      const response = await this.client.get('/sales/export', {
        params,
        responseType: 'blob',
      });
      return response.data;
    },
  };

  // ============== CUSTOMERS ==============
  customers = {
    getAll: async (params?: any): Promise<PaginatedResponse<Customer>> => {
      const response = await this.client.get<PaginatedResponse<Customer>>(
        '/customers/',
        { params }
      );
      return response.data;
    },

    getById: async (id: number): Promise<Customer> => {
      const response = await this.client.get<Customer>(`/customers/${id}`);
      return response.data;
    },

    update: async (id: number, data: Partial<Customer>): Promise<Customer> => {
      const response = await this.client.patch<Customer>(`/customers/${id}`, data);
      return response.data;
    },

    getPurchaseHistory: async (
      customerId: number,
      params?: any
    ): Promise<PaginatedResponse<Sale>> => {
      const response = await this.client.get<PaginatedResponse<Sale>>('/sales/', {
        params: { ...params, customer: customerId },
      });
      return response.data;
    },

    exportCSV: async (): Promise<Blob> => {
      const response = await this.client.get('/customers/export', {
        responseType: 'blob',
      });
      return response.data;
    },
  };

  // ============== DISCOUNTS ==============
  discounts = {
    getAll: async (params?: any): Promise<Discount[]> => {
      const response = await this.client.get<Discount[]>('/discounts/', { params });
      return response.data;
    },

    getById: async (id: number): Promise<Discount> => {
      const response = await this.client.get<Discount>(`/discounts/${id}`);
      return response.data;
    },

    create: async (data: DiscountFormData): Promise<Discount> => {
      const response = await this.client.post<Discount>('/discounts/', data);
      return response.data;
    },

    update: async (id: number, data: Partial<DiscountFormData>): Promise<Discount> => {
      const response = await this.client.patch<Discount>(`/discounts/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/discounts/${id}`);
    },

    checkCode: async (code: string): Promise<{ exists: boolean }> => {
      const response = await this.client.get<{ exists: boolean }>(
        `/discounts/check-code/${code}`
      );
      return response.data;
    },
  };

  // ============== REPORTS ==============
  reports = {
    getDashboardStats: async (): Promise<DashboardStats> => {
      const response = await this.client.get<DashboardStats>('/reports/dashboard-stats');
      return response.data;
    },

    getSalesOverTime: async (params: {
      start: string;
      end: string;
      granularity?: string;
    }): Promise<SalesOverTimeData[]> => {
      const response = await this.client.get<SalesOverTimeData[]>(
        '/reports/sales-over-time',
        { params }
      );
      return response.data;
    },

    getTopProducts: async (limit?: number): Promise<TopProduct[]> => {
      const response = await this.client.get<TopProduct[]>('/reports/top-products', {
        params: { limit: limit || 10 },
      });
      return response.data;
    },

    getSalesByCategory: async (): Promise<CategorySales[]> => {
      const response = await this.client.get<CategorySales[]>(
        '/reports/sales-by-category'
      );
      return response.data;
    },

    getRecentTransactions: async (limit?: number): Promise<Sale[]> => {
      const response = await this.client.get<Sale[]>('/sales/', {
        params: { limit: limit || 10, ordering: '-created_at' },
      });
      return response.data;
    },
  };

  // ============== USERS ==============
  users = {
    getAll: async (params?: any): Promise<User[]> => {
      const response = await this.client.get<User[]>('/users/', { params });
      return response.data;
    },

    getById: async (id: number): Promise<User> => {
      const response = await this.client.get<User>(`/users/${id}`);
      return response.data;
    },

    create: async (data: UserFormData): Promise<User> => {
      const response = await this.client.post<User>('/users/', data);
      return response.data;
    },

    update: async (id: number, data: Partial<UserFormData>): Promise<User> => {
      const response = await this.client.patch<User>(`/users/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await this.client.delete(`/users/${id}`);
    },

    resetPassword: async (id: number): Promise<{ temp_password: string }> => {
      const response = await this.client.post<{ temp_password: string }>(
        `/users/${id}/reset-password`
      );
      return response.data;
    },
  };

  // ============== SETTINGS ==============
  settings = {
    getStore: async (id: number): Promise<StoreSettings> => {
      const response = await this.client.get<StoreSettings>(`/stores/${id}`);
      return response.data;
    },

    updateStore: async (id: number, data: Partial<StoreSettings>): Promise<StoreSettings> => {
      const response = await this.client.patch<StoreSettings>(`/stores/${id}`, data);
      return response.data;
    },

    getAppSettings: async (): Promise<any> => {
      const response = await this.client.get('/settings/');
      return response.data;
    },

    updateAppSettings: async (data: any): Promise<any> => {
      const response = await this.client.patch('/settings/', data);
      return response.data;
    },
  };
}

export const api = new ApiService();
export default api;
