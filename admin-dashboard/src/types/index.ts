// User and Authentication Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'cashier' | 'stock_staff' | 'manager' | 'admin';
  store_id?: number;
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: User;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
  category_id: number;
  category?: Category;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  inventory?: InventoryItem;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

// Inventory Types
export interface InventoryItem {
  id: number;
  product_id: number;
  quantity: number;
  low_stock_threshold: number;
  last_updated: string;
}

export interface InventoryAdjustment {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  reason: string;
  notes?: string;
  adjusted_by: string;
  created_at: string;
}

// Sales Types
export interface Sale {
  id: number;
  receipt_number: string;
  cashier_id: number;
  cashier_name: string;
  customer_id?: number;
  customer_name?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: 'cash' | 'card' | 'mobile' | 'split';
  payment_details?: any;
  status: 'completed' | 'voided' | 'refunded';
  created_at: string;
  voided_at?: string;
  void_reason?: string;
}

export interface SaleItem {
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

// Customer Types
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  loyalty_points: number;
  total_purchases?: number;
  total_spent?: number;
  last_purchase?: string;
  created_at: string;
}

// Discount Types
export interface Discount {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase?: number;
  max_uses?: number;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

// Report Types
export interface DashboardStats {
  today_sales: number;
  today_transactions: number;
  low_stock_count: number;
  total_customers: number;
  new_customers_week: number;
  month_revenue: number;
  revenue_change_percent: number;
}

export interface SalesOverTimeData {
  date: string;
  sales: number;
  refunds?: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  units_sold: number;
  revenue: number;
}

export interface CategorySales {
  category: string;
  amount: number;
  percentage: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Form Types
export interface ProductFormData {
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
  category_id: number;
  description?: string;
  image_url?: string;
  initial_stock?: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export interface DiscountFormData {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase?: number;
  max_uses?: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password?: string;
  role: string;
  is_active: boolean;
}

// Settings Types
export interface StoreSettings {
  id: number;
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  tax_rate: number;
  currency: string;
}
