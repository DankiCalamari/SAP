import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { fetchLowStock } from '../store/inventorySlice';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { lowStockItems } = useSelector((state) => state.inventory);

  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isStaff = user && (user.role === 'stock_staff' || user.role === 'manager' || user.role === 'admin');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      if (isStaff) {
        // Load staff dashboard data
        const [statsResponse, activityResponse] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentActivity(),
        ]);

        setStats(statsResponse.data);
        setRecentActivity(activityResponse.data || []);

        // Load low stock items
        dispatch(fetchLowStock());
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {isStaff ? (
        <>
          {/* Staff Dashboard */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="cube-outline" size={32} color="#2196f3" />
                <Text style={styles.statValue}>{stats?.total_products || 0}</Text>
                <Text style={styles.statLabel}>Total Products</Text>
              </View>

              <TouchableOpacity
                style={[styles.statCard, styles.warningCard]}
                onPress={() => navigation.navigate('Products', { filter: 'low_stock' })}
              >
                <Icon name="warning-outline" size={32} color="#ff9800" />
                <Text style={styles.statValue}>{lowStockItems?.length || 0}</Text>
                <Text style={styles.statLabel}>Low Stock</Text>
              </TouchableOpacity>

              <View style={styles.statCard}>
                <Icon name="cash-outline" size={32} color="#4caf50" />
                <Text style={styles.statValue}>
                  {formatCurrency(stats?.total_inventory_value || 0)}
                </Text>
                <Text style={styles.statLabel}>Inventory Value</Text>
              </View>

              <View style={styles.statCard}>
                <Icon name="sync-outline" size={32} color="#666" />
                <Text style={styles.statValue}>
                  {stats?.last_sync ? formatDate(stats.last_sync) : 'Never'}
                </Text>
                <Text style={styles.statLabel}>Last Sync</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('BarcodeScanner')}
              >
                <Icon name="scan-outline" size={32} color="#2196f3" />
                <Text style={styles.actionText}>Scan Barcode</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('InventoryAdjust')}
              >
                <Icon name="create-outline" size={32} color="#2196f3" />
                <Text style={styles.actionText}>Adjust Inventory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Products', { filter: 'low_stock' })}
              >
                <Icon name="alert-circle-outline" size={32} color="#ff9800" />
                <Text style={styles.actionText}>View Low Stock</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Updates</Text>
              {recentActivity.slice(0, 10).map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.activityItem}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
                >
                  <View style={styles.activityContent}>
                    <Text style={styles.activityProduct}>{item.product_name}</Text>
                    <Text style={[
                      styles.activityChange,
                      { color: item.quantity >= 0 ? '#4caf50' : '#f44336' }
                    ]}>
                      {item.quantity >= 0 ? '+' : ''}{item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.activityTime}>{formatDate(item.created_at)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          {/* Customer Dashboard */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Welcome!</Text>
            <Text style={styles.welcomeText}>
              Browse our products and manage your wishlist
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Products')}
              >
                <Icon name="grid-outline" size={32} color="#2196f3" />
                <Text style={styles.actionText}>Browse Products</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('BarcodeScanner')}
              >
                <Icon name="scan-outline" size={32} color="#2196f3" />
                <Text style={styles.actionText}>Scan Product</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningCard: {
    borderColor: '#ff9800',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
    textAlign: 'center',
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  activityChange: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
