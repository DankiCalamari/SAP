# SAP POS Terminal (Electron App)

Desktop POS terminal for cashiers to process sales transactions in-store.

## Features

- User authentication (cashier, manager roles)
- Barcode/SKU product search
- Shopping cart management
- Customer loyalty lookup
- Discount code validation
- Payment processing (cash, card, split payment)
- Receipt printing
- Return/refund processing
- Offline mode with transaction queueing

## Project Structure

```
frontend-pos/
├── main.js                    # Electron main process
├── preload.js                # Electron IPC bridge
├── public/
│   └── index.html
├── src/
│   ├── index.jsx              # React entry point
│   ├── App.jsx                # Main app component
│   ├── App.css                # Global styles
│   ├── api.js                 # API client
│   ├── store.js               # Zustand state management
│   ├── screens/
│   │   ├── LoginScreen.jsx    # (TO BE IMPLEMENTED)
│   │   ├── POSScreen.jsx      # (TO BE IMPLEMENTED)
│   │   ├── ReturnScreen.jsx   # (TO BE IMPLEMENTED)
│   │   └── SettingsScreen.jsx # (TO BE IMPLEMENTED)
│   ├── components/
│   │   ├── ProductSearch/     # (TO BE IMPLEMENTED)
│   │   ├── Cart/              # (TO BE IMPLEMENTED)
│   │   ├── PaymentModal/      # (TO BE IMPLEMENTED)
│   │   ├── ReceiptPrinter/    # (TO BE IMPLEMENTED)
│   │   └── ...
│   ├── hooks/
│   │   ├── useInventory.js    # (TO BE IMPLEMENTED)
│   │   ├── useCart.js         # (TO BE IMPLEMENTED)
│   │   └── ...
│   └── utils/
│       ├── format.js          # (TO BE IMPLEMENTED)
│       └── validators.js      # (TO BE IMPLEMENTED)
└── package.json
```

## Setup

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Screens to Implement

### 1. LoginScreen (src/screens/LoginScreen.jsx)
- Username/password input
- "Remember Me" checkbox
- Login button with error handling
- Redirect to POSScreen on success

**Key Functions:**
- `handleLogin()` - Call `api.login()` and store tokens
- Handle validation errors
- Store in `useAuthStore`

### 2. POSScreen (src/screens/POSScreen.jsx) - Main Screen
**Layout:**
```
┌─────────────────────────────────────────┐
│  Product Search (Barcode/Name)          │  40%
│  - Search field (auto-focus)            │
│  - Product list (search results)        │
│  - Click to add to cart                 │
├─────────────────────────────────────────┤
│  Shopping Cart                          │  60%
│  - Item list (qty, price, total)        │
│  - +/- buttons per item                 │
│  - Subtotal                             │
│  - Discount applied                     │
│  - Tax                                  │
│  - TOTAL (large, prominent)             │
│  - Buttons: [Apply Discount] [Customer]│
│              [Complete Sale]             │
│              [Cancel/Clear]             │
└─────────────────────────────────────────┘
```

**State Management:**
- `useCartStore` - cart items, customer, discount
- `useAuthStore` - current user

**Components Used:**
- ProductSearch
- Cart
- Quick buttons for common actions

**Key Functions:**
- `handleBarcodeSearch()` - Call `api.searchProductByBarcode()`
- `handleAddToCart()` - Call `useCartStore.addItem()`
- `handleApplyDiscount()` - Show discount modal
- `handleLookupCustomer()` - Show customer search modal
- `handleCompleteSale()` - Call `api.createSale()`

### 3. ProductSearch Component
- Input field (auto-focus on mount)
- Real-time search as user types (debounced)
- Display results in list/grid
- Click item to add to cart

**Props:**
- `onSelectProduct(product, quantity)` - Callback when product selected

### 4. Cart Component
- Display cart items in table
- Quantity +/- buttons
- Remove item button
- Show running totals
- Show applied discount
- Show tax calculation

**Props:**
- `items` - Array of cart items
- `onUpdateQuantity(productId, qty)` - Update quantity
- `onRemoveItem(productId)` - Remove from cart

### 5. PaymentModal
- Payment method selection (Cash, Card, Split)
- **Cash:** Amount input, auto-calculate change
- **Card:** Show payment form (Stripe placeholder)
- **Split:** Multiple payment methods
- Process payment button
- Error handling and retry logic

**Key Functions:**
- `handlePayment()` - Process payment and call `api.createSale()`
- `calculateChange()` - For cash payments

### 6. ReceiptPrinter Component
- Display formatted receipt
- Print button (window.print())
- Email option (if customer has email)
- "Start New Sale" button

**Props:**
- `receiptData` - Sale and receipt information

### 7. ReturnScreen (src/screens/ReturnScreen.jsx)
- Search original transaction (receipt number, date, customer)
- Display original items
- Select items to return + quantities
- Validate return window (60 days)
- Calculate refund
- Process refund button
- Print return receipt

**Key Functions:**
- `handleSearchSale()` - Find original transaction
- `handleProcessReturn()` - Call `api.refundSale()`

### 8. SettingsScreen (src/screens/SettingsScreen.jsx)
- Store info display
- Printer configuration
- Tax rate settings
- Offline mode status
- Logout button

## State Management (Zustand Stores)

### useAuthStore
```javascript
{
  user,              // Current user object
  tokens,            // { access_token, refresh_token }
  storeId,           // Current store
  setUser(),
  setTokens(),
  logout()
}
```

### useCartStore
```javascript
{
  items,             // Array of cart items
  customer,          // Selected customer (optional)
  discount,          // Applied discount
  discountAmount,    // Calculated discount amount
  addItem(),
  updateQuantity(),
  removeItem(),
  setCustomer(),
  setDiscount(),
  clear(),
  getCartSummary()   // Returns { subtotal, tax, total }
}
```

### usePOSStore
```javascript
{
  isProcessing,      // Is sale being processed
  lastSaleId,        // Last completed sale ID
  lastReceiptData,   // Receipt data for printing
  setProcessing(),
  setSaleId(),
  setReceiptData()
}
```

## API Integration

All API calls go through `src/api.js` which is already configured with:
- Base URL from environment variable `REACT_APP_API_URL`
- Automatic JWT token injection in Authorization header
- Automatic redirect to login on 401 responses

### Key API Methods
```javascript
api.login(username, password)
api.getProducts(params)
api.searchProductByBarcode(barcode)
api.getInventory(productId)
api.createSale(saleData)
api.searchCustomers(phone)
api.validateDiscount(code, cartItems)
api.voidSale(saleId, reason)
api.refundSale(saleId, items, reason)
```

## Hooks to Implement

### useInventory.js
```javascript
const { inventory, loading, error } = useInventory(productId);
// Fetches inventory for product on mount/change
```

### useCart.js
```javascript
const cart = useCart();
// Wrapper around useCartStore with helper functions
```

### usePrinter.js
```javascript
const { print, isPrinting } = usePrinter();
// Handle printer configuration and printing
```

## Utils to Implement

### format.js
```javascript
formatCurrency(amount)     // $0.00
formatDate(date)           // MM/DD/YYYY
formatPhone(phone)         // (123) 456-7890
```

### validators.js
```javascript
validateEmail(email)
validatePhone(phone)
validateQuantity(qty)
isReturnEligible(saleDate)  // Check 60-day window
```

## Environment Variables

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_STORE_ID=uuid-of-store
```

## Offline Mode (TBD)

- Queue transactions when offline
- Sync queue when reconnected
- Use SQLite for local product cache
- Show offline status indicator

## Key Implementation Notes

1. **Barcode Scanning**: The barcode input field auto-focuses, allowing seamless scanning without clicking
2. **Performance**: Use React.memo for expensive components
3. **Error Handling**: Show user-friendly error messages for all API calls
4. **State Persistence**: Auth tokens persist in localStorage via zustand middleware
5. **Responsive Design**: POS works on tablet-sized screens (minimum 800x600)

## Testing the POS Flow

1. Login as cashier
2. Scan/search products and add to cart
3. Apply discount code (optional)
4. Lookup customer for loyalty (optional)
5. Select payment method
6. Complete sale
7. Print receipt

## Build for Production

```bash
npm run build
```

Creates distributable package for Windows, macOS, and Linux.

## Documentation

- Backend API: See `../backend-api/README.md`
- Planning: See `../../planning.md`
