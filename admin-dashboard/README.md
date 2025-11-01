# SAP Admin Dashboard

React + TypeScript web application for managers and administrators. Provides analytics, user management, inventory control, and business reporting for the SAP retail management platform.

## Features

- **Dashboard**: Real-time metrics, sales charts, recent transactions
- **Sales Management**: Transaction history with filtering, export, and void capabilities
- **Inventory Control**: Stock levels, adjustments, product management
- **Customer Management**: Customer profiles, purchase history, loyalty tracking
- **Discount Management**: Create and manage discount codes
- **Analytics & Reports**: Business intelligence with D3.js visualizations
- **User Management**: Admin-only user account control
- **Store Settings**: Configuration for tax, currency, business hours

## Tech Stack

- React 18 + TypeScript
- Material-UI (MUI) for UI components
- React Router v6 for navigation
- React Query (TanStack Query) for data fetching
- React Hook Form + Zod for form validation
- D3.js for data visualizations
- Axios for API calls
- date-fns for date formatting

## Prerequisites

- Node.js >= 16
- npm or yarn
- Backend API running on http://localhost:8000

## Installation

### 1. Install Dependencies

\`\`\`bash
cd SAP/admin-dashboard
npm install
\`\`\`

### 2. Environment Configuration

The API base URL is configured in `src/services/api.ts`. Update if needed:

\`\`\`typescript
const BASE_URL = 'http://localhost:8000/api';
\`\`\`

### 3. Start Development Server

\`\`\`bash
npm start
\`\`\`

The app will open at http://localhost:3000

## Project Structure

\`\`\`
src/
├── components/          # Reusable UI components
│   ├── Layout/          # AppLayout with sidebar and header
│   ├── Charts/          # D3.js chart components
│   ├── MetricCard.tsx   # Dashboard metric display
│   └── LoadingState.tsx # Loading skeletons
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state management
├── pages/               # Application pages
│   ├── LoginPage.tsx    # Authentication
│   ├── DashboardPage.tsx # Main dashboard
│   ├── SalesPage.tsx    # Sales management
│   └── ...              # Other pages (see patterns below)
├── services/            # External services
│   └── api.ts           # API client with TypeScript
├── types/               # TypeScript type definitions
│   └── index.ts         # All interfaces and types
├── utils/               # Utility functions
│   ├── formatters.ts    # Data formatting helpers
│   └── validators.ts    # Zod validation schemas
├── App.tsx              # Main app with routing
└── index.tsx            # Entry point
\`\`\`

## Authentication

### Access Control

Only users with **manager** or **admin** roles can access the dashboard.

### Test Credentials

Use backend test accounts:
- Manager: manager@example.com / password
- Admin: admin@example.com / password

### Protected Routes

All routes except `/login` require authentication. Unauthenticated users are redirected to the login page.

## Implemented Pages

### ✅ Complete Implementation

1. **LoginPage** (`/login`)
   - Email/password authentication
   - Role-based access control (manager/admin only)
   - Remember me functionality
   - Form validation with Zod

2. **DashboardPage** (`/dashboard`)
   - 4 metric cards (sales, low stock, customers, revenue)
   - Recent transactions table
   - Chart placeholder for D3.js visualizations

3. **SalesPage** (`/sales`)
   - Paginated sales table
   - Search functionality
   - CSV export
   - Status and payment method chips
   - Navigation to sale details

### 📋 Implementation Patterns

The following pages follow the same patterns as DashboardPage and SalesPage. Implement using:

**List Pages Pattern** (like SalesPage):
- `/inventory` - InventoryPage
- `/customers` - CustomersPage
- `/discounts` - DiscountsPage
- `/users` - UsersPage (admin only)

**Detail Pages Pattern**:
- `/sales/:id` - SaleDetailPage
- `/customers/:id` - CustomerDetailPage

**Form Pages Pattern**:
- `/inventory/products/new` - ProductFormPage
- `/inventory/products/:id/edit` - ProductFormPage (edit mode)
- `/discounts/new` - DiscountFormPage
- `/discounts/:id/edit` - DiscountFormPage (edit mode)
- `/users/new` - UserFormPage (admin only)

**Complex Pages**:
- `/inventory` - InventoryPage with tabs
- `/reports` - ReportsPage with D3.js charts
- `/settings` - SettingsPage with multiple sections

## Implementation Guide

### Creating a New Page

1. **Create the page component**:
\`\`\`typescript
// src/pages/ExamplePage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { api } from '../services/api';
import LoadingState from '../components/LoadingState';

const ExamplePage: React.FC = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.yourEndpoint();
      setData(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState variant="page" />;

  return (
    <Box>
      <Typography variant="h4" mb={3}>Your Page Title</Typography>
      {/* Your content */}
    </Box>
  );
};

export default ExamplePage;
\`\`\`

2. **Add the route** in `App.tsx`:
\`\`\`typescript
<Route path="your-path" element={<ExamplePage />} />
\`\`\`

3. **Update navigation** in `AppLayout.tsx` if needed

### Using the API Service

The API service is fully typed and organized by resource:

\`\`\`typescript
// Products
const products = await api.products.getAll({ search: 'query' });
const product = await api.products.getById(1);
await api.products.create(formData);
await api.products.update(1, updates);
await api.products.delete(1);

// Sales
const sales = await api.sales.getAll({ limit: 25, offset: 0 });
const sale = await api.sales.getById(1);
await api.sales.void(1, 'reason');

// Customers
const customers = await api.customers.getAll();
const customer = await api.customers.getById(1);
await api.customers.update(1, updates);

// Reports
const stats = await api.reports.getDashboardStats();
const salesData = await api.reports.getSalesOverTime({ start, end });
const topProducts = await api.reports.getTopProducts(10);
\`\`\`

### Form Validation

Use Zod schemas from `utils/validators.ts`:

\`\`\`typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '../utils/validators';

const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
  resolver: zodResolver(productSchema),
});

const onSubmit = async (data: ProductFormData) => {
  await api.products.create(data);
};
\`\`\`

### Data Formatting

Use formatters from `utils/formatters.ts`:

\`\`\`typescript
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';

formatCurrency(1234.56);        // "$1,234.56"
formatDate('2024-01-15');       // "Jan 15, 2024"
formatPhone('5551234567');      // "(555) 123-4567"
\`\`\`

## D3.js Charts

Chart components should be created in `src/components/Charts/`:

### Example LineChart

\`\`\`typescript
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface LineChartProps {
  data: Array<{ date: string; value: number }>;
  width?: number;
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, width = 600, height = 400 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // D3 implementation here
    const svg = d3.select(svgRef.current);
    // ... chart rendering logic
  }, [data]);

  return <svg ref={svgRef} width={width} height={height} />;
};

export default LineChart;
\`\`\`

## Styling

### MUI Theme Customization

The theme is defined in `App.tsx`:

\`\`\`typescript
const theme = createTheme({
  palette: {
    primary: { main: '#2196f3' },
    secondary: { main: '#ff9800' },
  },
});
\`\`\`

### Inline Styles

Use MUI's `sx` prop for component-specific styles:

\`\`\`typescript
<Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
  {/* Content */}
</Box>
\`\`\`

## Role-Based Access

### Check User Role

\`\`\`typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  return <AdminContent />;
};
\`\`\`

### Admin-Only Routes

Admin-only routes are already configured in `App.tsx`. The sidebar in `AppLayout.tsx` conditionally shows the Users menu item.

## Build for Production

\`\`\`bash
npm run build
\`\`\`

The optimized build will be in the `build/` directory.

## Development Tips

1. **API Mocking**: During development, you can mock API responses in the service layer
2. **Error Handling**: All API calls should have try/catch blocks
3. **Loading States**: Always show loading indicators while fetching data
4. **Type Safety**: Use TypeScript interfaces from `types/index.ts`
5. **Validation**: Use Zod schemas for all form inputs
6. **Formatting**: Use utility formatters for consistent data display

## Common Issues

### CORS Errors
Ensure the backend API has CORS configured to allow requests from `http://localhost:3000`

### Authentication Loop
Clear localStorage and try logging in again:
\`\`\`javascript
localStorage.clear();
\`\`\`

### 401 Errors
The API service automatically handles 401s by clearing the token and redirecting to login

## Testing

Create test accounts in the backend with appropriate roles:
- Test manager account for general dashboard access
- Test admin account for user management features

## License

Proprietary - SAP Platform

---

**Note**: This implementation provides a complete foundation with working authentication, dashboard, and sales management. Additional pages follow the same patterns demonstrated in the implemented pages. Refer to the planning document for detailed specifications of each page.
