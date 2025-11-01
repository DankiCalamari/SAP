import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { fetchProducts, setFilters } from '../store/productsSlice';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

export default function ProductListScreen({ route }) {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { items, loading, filters, offline } = useSelector((state) => state.products);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load products on mount and when filters change
  useFocusEffect(
    useCallback(() => {
      loadProducts();
      loadCategories();
    }, [filters])
  );

  // Handle filter from navigation params (e.g., low_stock from dashboard)
  useEffect(() => {
    if (route.params?.filter === 'low_stock') {
      dispatch(setFilters({ stockStatus: 'low' }));
    }
  }, [route.params]);

  const loadProducts = async () => {
    try {
      await dispatch(fetchProducts({ filters, offline: false })).unwrap();
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    try {
      await dispatch(fetchProducts({ filters: { ...filters, search: searchQuery } })).unwrap();
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const renderProduct = ({ item }) => (
    <ProductCard product={item} onPress={handleProductPress} showStock={true} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cube-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No products found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196f3" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with search and barcode scanner */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              loadProducts();
            }}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('BarcodeScanner')}
        >
          <Icon name="scan" size={24} color="#2196f3" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon name="filter" size={24} color={showFilters ? '#2196f3' : '#666'} />
        </TouchableOpacity>
      </View>

      {/* Offline Banner */}
      {offline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>Offline Mode</Text>
        </View>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !filters.category && styles.filterChipActive,
                ]}
                onPress={() => handleFilterChange('category', null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !filters.category && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.filterChip,
                    filters.category === cat.id && styles.filterChipActive,
                  ]}
                  onPress={() => handleFilterChange('category', cat.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.category === cat.id && styles.filterChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stock Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Stock Status</Text>
            <View style={styles.filterChips}>
              {['all', 'in_stock', 'low', 'out'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    (status === 'all' ? !filters.stockStatus : filters.stockStatus === status) &&
                      styles.filterChipActive,
                  ]}
                  onPress={() =>
                    handleFilterChange('stockStatus', status === 'all' ? null : status)
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      (status === 'all' ? !filters.stockStatus : filters.stockStatus === status) &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {status === 'all'
                      ? 'All'
                      : status === 'in_stock'
                      ? 'In Stock'
                      : status === 'low'
                      ? 'Low Stock'
                      : 'Out of Stock'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.filterChips}>
              {[
                { value: 'name_asc', label: 'Name A-Z' },
                { value: 'name_desc', label: 'Name Z-A' },
                { value: 'price_asc', label: 'Price Low-High' },
                { value: 'price_desc', label: 'Price High-Low' },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.value}
                  style={[
                    styles.filterChip,
                    filters.sortBy === sort.value && styles.filterChipActive,
                  ]}
                  onPress={() => handleFilterChange('sortBy', sort.value)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.sortBy === sort.value && styles.filterChipTextActive,
                    ]}
                  >
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Product List */}
      <FlatList
        data={items}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading && renderEmpty}
        ListFooterComponent={renderFooter}
        refreshing={loading}
        onRefresh={loadProducts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#1a1a1a',
  },
  iconButton: {
    padding: 8,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff9800',
    padding: 8,
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  filterPanel: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
});
