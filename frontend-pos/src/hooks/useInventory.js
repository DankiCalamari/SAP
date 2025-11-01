import { useState, useEffect } from 'react';
import api from '../api';

/**
 * useInventory - Fetch and manage inventory data for a product
 * @param {number|null} productId - Product ID to fetch inventory for
 * @returns {object} { inventory, loading, error, refetch }
 */
export function useInventory(productId) {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventory = async () => {
    if (!productId) {
      setInventory(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.getInventoryByProduct(productId);
      setInventory(response.data);
    } catch (err) {
      setError(err);
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [productId]);

  const refetch = () => {
    fetchInventory();
  };

  return {
    inventory,
    loading,
    error,
    refetch,
  };
}
