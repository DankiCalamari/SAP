import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { fetchInventory } from '../store/inventorySlice';
import { formatDate } from '../utils/format';

export default function InventoryScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { adjustments, loading } = useSelector((state) => state.inventory);

  // Access control
  const hasAccess = user && (user.role === 'stock_staff' || user.role === 'manager' || user.role === 'admin');

  useEffect(() => {
    if (hasAccess) {
      loadInventoryData();
    }
  }, [hasAccess]);

  const loadInventoryData = async () => {
    try {
      await dispatch(fetchInventory()).unwrap();
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  if (!hasAccess) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Icon name="lock-closed-outline" size={64} color="#f44336" />
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedText}>
          This feature is only available to stock staff and managers.
        </Text>
      </View>
    );
  }

  const renderAdjustment = ({ item }) => (
    <View style={styles.adjustmentCard}>
      <View style={styles.adjustmentHeader}>
        <View style={styles.adjustmentLeft}>
          <Text style={styles.productName}>{item.product_name || 'Unknown Product'}</Text>
          <Text style={styles.sku}>SKU: {item.product_sku || 'N/A'}</Text>
        </View>
        <View
          style={[
            styles.quantityBadge,
            { backgroundColor: item.quantity >= 0 ? '#e8f5e9' : '#ffebee' },
          ]}
        >
          <Text
            style={[
              styles.quantityText,
              { color: item.quantity >= 0 ? '#4caf50' : '#f44336' },
            ]}
          >
            {item.quantity >= 0 ? '+' : ''}
            {item.quantity}
          </Text>
        </View>
      </View>

      <View style={styles.adjustmentBody}>
        <View style={styles.adjustmentRow}>
          <Icon name="information-circle-outline" size={16} color="#666" />
          <Text style={styles.adjustmentLabel}>Reason:</Text>
          <Text style={styles.adjustmentValue}>{item.reason || 'No reason provided'}</Text>
        </View>

        {item.notes && (
          <View style={styles.adjustmentRow}>
            <Icon name="document-text-outline" size={16} color="#666" />
            <Text style={styles.adjustmentLabel}>Notes:</Text>
            <Text style={styles.adjustmentValue}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.adjustmentRow}>
          <Icon name="person-outline" size={16} color="#666" />
          <Text style={styles.adjustmentLabel}>By:</Text>
          <Text style={styles.adjustmentValue}>{item.adjusted_by || 'System'}</Text>
        </View>

        <View style={styles.adjustmentRow}>
          <Icon name="time-outline" size={16} color="#666" />
          <Text style={styles.adjustmentLabel}>When:</Text>
          <Text style={styles.adjustmentValue}>{formatDate(item.created_at)}</Text>
        </View>

        {item.status === 'queued' && (
          <View style={styles.queuedBanner}>
            <Icon name="cloud-upload-outline" size={16} color="#ff9800" />
            <Text style={styles.queuedText}>Queued for sync</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="clipboard-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No inventory adjustments</Text>
      <Text style={styles.emptySubtext}>Tap the + button to make your first adjustment</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('BarcodeScanner')}
        >
          <Icon name="scan" size={24} color="#2196f3" />
        </TouchableOpacity>
      </View>

      {/* Adjustments List */}
      <FlatList
        data={adjustments}
        renderItem={renderAdjustment}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading && renderEmpty}
        refreshing={loading}
        onRefresh={loadInventoryData}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('InventoryAdjust')}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
  },
  accessDeniedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  adjustmentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adjustmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  adjustmentLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sku: {
    fontSize: 12,
    color: '#999',
  },
  quantityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  adjustmentBody: {
    padding: 16,
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adjustmentLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 6,
  },
  adjustmentValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  queuedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  queuedText: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '600',
    marginLeft: 6,
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
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
