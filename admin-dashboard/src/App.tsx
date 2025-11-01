import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import LoadingState from './components/LoadingState';

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff9800',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000, // 1 minute
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Placeholder component for unimplemented pages
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: '24px' }}>
    <h2>{title}</h2>
    <p>This page is not yet implemented. See the pattern examples in DashboardPage and SalesPage.</p>
    <p>
      <strong>Implementation notes:</strong>
      <ul>
        <li>Use the API service from services/api.ts</li>
        <li>Use Material-UI components for consistent design</li>
        <li>Follow the validation schemas from utils/validators.ts</li>
        <li>Use formatters from utils/formatters.ts for data display</li>
      </ul>
    </p>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="sales/:id" element={<PlaceholderPage title="Sale Details" />} />
                <Route path="inventory" element={<PlaceholderPage title="Inventory Management" />} />
                <Route path="inventory/products" element={<PlaceholderPage title="Products" />} />
                <Route path="inventory/products/new" element={<PlaceholderPage title="New Product" />} />
                <Route path="inventory/products/:id/edit" element={<PlaceholderPage title="Edit Product" />} />
                <Route path="customers" element={<PlaceholderPage title="Customers" />} />
                <Route path="customers/:id" element={<PlaceholderPage title="Customer Details" />} />
                <Route path="discounts" element={<PlaceholderPage title="Discounts" />} />
                <Route path="discounts/new" element={<PlaceholderPage title="New Discount" />} />
                <Route path="discounts/:id/edit" element={<PlaceholderPage title="Edit Discount" />} />
                <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
                <Route path="users" element={<PlaceholderPage title="User Management" />} />
                <Route path="users/new" element={<PlaceholderPage title="New User" />} />
                <Route path="settings" element={<PlaceholderPage title="Settings" />} />
              </Route>

              {/* 404 - Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
