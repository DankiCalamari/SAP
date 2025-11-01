import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ShoppingCart,
  Warning,
  People,
  TrendingUp,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import { api } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import type { DashboardStats, Sale } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsData, transactionsData] = await Promise.all([
        api.reports.getDashboardStats(),
        api.reports.getRecentTransactions(10),
      ]);

      setStats(statsData);
      setRecentTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'voided':
        return 'error';
      case 'refunded':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <LoadingState variant="card" />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard
        </Typography>
        <IconButton onClick={loadDashboardData} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Today's Sales"
            value={formatCurrency(stats?.today_sales || 0)}
            subtitle={`${stats?.today_transactions || 0} transactions`}
            icon={<ShoppingCart />}
            color="#2196f3"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Low Stock Items"
            value={stats?.low_stock_count || 0}
            subtitle="Need restocking"
            icon={<Warning />}
            color="#ff9800"
            onClick={() => navigate('/inventory')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Customers"
            value={stats?.total_customers || 0}
            subtitle={`${stats?.new_customers_week || 0} new this week`}
            icon={<People />}
            color="#4caf50"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue This Month"
            value={formatCurrency(stats?.month_revenue || 0)}
            subtitle={`${stats?.revenue_change_percent || 0}% vs last month`}
            icon={<TrendingUp />}
            trend={{
              direction: (stats?.revenue_change_percent || 0) >= 0 ? 'up' : 'down',
              value: Math.abs(stats?.revenue_change_percent || 0),
            }}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Charts Section - Placeholder */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Sales Overview (Last 30 Days)
            </Typography>
            <Box
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                borderRadius: 1,
              }}
            >
              <Typography color="text.secondary">
                Chart visualization would be rendered here using D3.js
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Transactions Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          Recent Transactions
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Receipt #</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">No transactions yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/sales/${transaction.id}`)}
                  >
                    <TableCell>{transaction.receipt_number}</TableCell>
                    <TableCell>{formatDateTime(transaction.created_at)}</TableCell>
                    <TableCell>{transaction.cashier_name}</TableCell>
                    <TableCell>{transaction.customer_name || 'Walk-in'}</TableCell>
                    <TableCell align="right">{formatCurrency(transaction.total)}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
