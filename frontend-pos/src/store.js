import create from 'zustand';
import persist from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      tokens: { access_token: null, refresh_token: null },
      storeId: null,

      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),
      setStoreId: (storeId) => set({ storeId }),

      logout: () => set({
        user: null,
        tokens: { access_token: null, refresh_token: null },
        storeId: null,
      }),
    }),
    {
      name: 'auth-store',
    }
  )
);

export const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  discount: null,
  discountAmount: 0,

  addItem: (product, quantity) =>
    set((state) => {
      const existing = state.items.find((item) => item.product_id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product_id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  line_total: (item.quantity + quantity) * item.unit_price,
                }
              : item
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            product_id: product.id,
            product_name: product.name,
            quantity,
            unit_price: parseFloat(product.unit_price),
            line_total: quantity * parseFloat(product.unit_price),
            tax_rate: parseFloat(product.tax_rate),
          },
        ],
      };
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.product_id !== productId) };
      }
      return {
        items: state.items.map((item) =>
          item.product_id === productId
            ? {
                ...item,
                quantity,
                line_total: quantity * item.unit_price,
              }
            : item
        ),
      };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.product_id !== productId),
    })),

  setCustomer: (customer) => set({ customer }),

  setDiscount: (discount) => set({ discount, discountAmount: discount?.discount_amount || 0 }),

  clear: () =>
    set({
      items: [],
      customer: null,
      discount: null,
      discountAmount: 0,
    }),

  getCartSummary: () => {
    const state = get();
    const subtotal = state.items.reduce((sum, item) => sum + item.line_total, 0);
    const taxAmount = state.items.reduce(
      (sum, item) => sum + (item.line_total * item.tax_rate) / 100,
      0
    );
    const discountAmount = state.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      itemCount: state.items.length,
    };
  },
}));

export const usePOSStore = create((set) => ({
  isProcessing: false,
  lastSaleId: null,
  lastReceiptData: null,

  setProcessing: (processing) => set({ isProcessing: processing }),
  setSaleId: (saleId) => set({ lastSaleId: saleId }),
  setReceiptData: (data) => set({ lastReceiptData: data }),
}));
