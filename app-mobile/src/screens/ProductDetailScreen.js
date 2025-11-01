import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';
import { formatCurrency, formatDate, getStockStatus } from '../utils/format';
import StockBadge from '../components/StockBadge';

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;

  const user = useSelector((state) => state.auth.user);
  const isStaff = user && (user.role === 'stock_staff' || user.role === 'manager' || user.role === 'admin');

  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);

      // Load product details
      const productResponse = await api.getProductById(productId);
      setProduct(productResponse.data);

      if (isStaff) {
        // Load inventory data for staff
        const inventoryResponse = await api.getInventoryByProduct(productId);
        setInventory(inventoryResponse.data);

        // Load inventory history (could be from /api/inventory/history/:productId)
        // For now, using recent adjustments from inventory endpoint
        try {
          const historyResponse = await api.getInventory({ product_id: productId });
          setInventoryHistory(historyResponse.data?.results?.slice(0, 10) || []);
        } catch (error) {
          console.error('Error loading inventory history:', error);
        }
      }
    } catch (error) {
      console.error('Error loading product details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const stockStatus = inventory
    ? getStockStatus(inventory.quantity, inventory.low_stock_threshold)
    : null;

  return (
    <ScrollView style={styles.container}>
      {/* Product Image */}
      <View style={styles.imageSection}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="image-outline" size={64} color="#ccc" />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoSection}>
        <Text style={styles.productName}>{product.name}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.sku}>SKU: {product.sku}</Text>
          {product.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          )}
        </View>

        <Text style={styles.price}>{formatCurrency(product.price)}</Text>

        {product.description && (
          <View style={styles.descriptionSection}>
            <Text
              style={styles.description}
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {product.description}
            </Text>
            {product.description.length > 150 && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.readMore}>
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Inventory Section (Staff Only) */}
      {isStaff && inventory && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory</Text>

            <View style={styles.inventoryCard}>
              <View style={styles.inventoryRow}>
                <Text style={styles.inventoryLabel}>Current Stock</Text>
                <View style={styles.inventoryValue}>
                  <Text style={styles.inventoryNumber}>{inventory.quantity} units</Text>
                  <StockBadge
                    quantity={inventory.quantity}
                    lowThreshold={inventory.low_stock_threshold}
                  />
                </View>
              </View>

              <View style={styles.inventoryRow}>
                <Text style={styles.inventoryLabel}>Low Stock Threshold</Text>
                <Text style={styles.inventoryText}>{inventory.low_stock_threshold} units</Text>
              </View>

              <View style={styles.inventoryRow}>
                <Text style={styles.inventoryLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: stockStatus.color }]}>
                  <Text style={styles.statusText}>{stockStatus.label}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() =>
                navigation.navigate('InventoryAdjust', { productId: product.id })
              }
            >
              <Icon name="create-outline" size={20} color="#fff" />
              <Text style={styles.adjustButtonText}>Adjust Inventory</Text>
            </TouchableOpacity>
          </View>

          {/* Inventory History */}
          {inventoryHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>

              {inventoryHistory.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                    <Text style={styles.historyType}>{item.reason || 'Adjustment'}</Text>
                  </View>
                  <Text
                    style={[
                      styles.historyQuantity,
                      { color: item.quantity >= 0 ? '#4caf50' : '#f44336' },
                    ]}
                  >
                    {item.quantity >= 0 ? '+' : ''}
                    {item.quantity}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  imageSection: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sku: {
    fontSize: 14,
    color: '#999',
    marginRight: 12,
  },
  categoryBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#2196f3',
    fontWeight: '600',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 16,
  },
  descriptionSection: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  readMore: {
    fontSize: 14,
    color: '#2196f3',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inventoryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inventoryLabel: {
    fontSize: 14,
    color: '#666',
  },
  inventoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inventoryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginRight: 8,
  },
  inventoryText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 14,
  },
  adjustButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  historyType: {
    fontSize: 14,
    color: '#666',
  },
  historyQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
