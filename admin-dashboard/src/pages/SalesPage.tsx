import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Visibility, Block, Search, FileDownload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../components/LoadingState';
import { api } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import type { Sale, PaginatedResponse } from '../types';

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSales();
  }, [page, rowsPerPage, searchQuery]);

  const loadSales = async () => {
    try {
      setLoading(true);

      const params: any = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response: PaginatedResponse<Sale> = await api.sales.getAll(params);
      setSales(response.results);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const blob = await api.sales.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting sales:', error);
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

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'success';
      case 'card':
        return 'primary';
      case 'mobile':
        return 'secondary';
      case 'split':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && sales.length === 0) {
    return <LoadingState variant="page" />;
  }

  return (
    <Box>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Sales Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search by receipt number, cashier, or customer..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Sales Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Receipt #</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="center">Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary">
                      No sales found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>{sale.receipt_number}</TableCell>
                    <TableCell>{formatDateTime(sale.created_at)}</TableCell>
                    <TableCell>{sale.cashier_name}</TableCell>
                    <TableCell>{sale.customer_name || 'Walk-in'}</TableCell>
                    <TableCell align="center">{sale.items.length}</TableCell>
                    <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <Chip
                        label={sale.payment_method}
                        color={getPaymentMethodColor(sale.payment_method)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sale.status}
                        color={getStatusColor(sale.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/sales/${sale.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                      {sale.status === 'completed' && (
                        <IconButton size="small" color="error">
                          <Block />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

export default SalesPage;
