import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  login(username, password) {
    return this.client.post('/auth/login', { username, password });
  }

  logout() {
    return this.client.post('/auth/logout');
  }

  refreshToken(refreshToken) {
    return this.client.post('/auth/refresh-token', { refresh_token: refreshToken });
  }

  // Product endpoints
  getProducts(params = {}) {
    return this.client.get('/products', { params });
  }

  searchProductByBarcode(barcode) {
    return this.client.get('/products/by_barcode', { params: { barcode } });
  }

  // Inventory endpoints
  getInventory(productId) {
    return this.client.get(`/inventory/by_product`, { params: { product_id: productId } });
  }

  getLowStockProducts() {
    return this.client.get('/inventory/low_stock');
  }

  // Sales endpoints
  createSale(saleData) {
    return this.client.post('/sales/create_transaction', saleData);
  }

  getSaleReceipt(saleId) {
    return this.client.get(`/sales/${saleId}/receipt`);
  }

  voidSale(saleId, reason) {
    return this.client.post(`/sales/${saleId}/void`, { reason });
  }

  refundSale(saleId, items, reason) {
    return this.client.post(`/sales/${saleId}/refund`, { items, reason });
  }

  getSales(params = {}) {
    return this.client.get('/sales', { params });
  }

  // Customer endpoints
  searchCustomers(phone) {
    return this.client.get('/customers/search', { params: { phone } });
  }

  createCustomer(data) {
    return this.client.post('/customers', data);
  }

  // Discount endpoints
  validateDiscount(code, cartItems) {
    return this.client.post('/discounts/validate', {
      discount_code: code,
      product_ids: cartItems.map(item => item.product_id),
      subtotal: cartItems.reduce((sum, item) => sum + item.line_total, 0),
    });
  }

  getAvailableDiscounts() {
    return this.client.get('/discounts/available');
  }

  // Returns endpoints
  createReturn(saleId, items, reason) {
    return this.client.post('/returns/create_return', {
      original_sale_id: saleId,
      items,
      return_reason: reason,
    });
  }
}

export default new APIClient();
