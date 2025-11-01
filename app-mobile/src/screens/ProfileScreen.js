import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUser } from '../store/authSlice';
import { processQueue } from '../store/syncSlice';
import { toggleOfflineMode, toggleNotification } from '../store/settingsSlice';
import { clearDatabase } from '../database/schema';
import { deleteToken } from '../services/notifications';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const { offlineMode, notifications } = useSelector((state) => state.settings);
  const { queueCount, syncing } = useSelector((state) => state.sync);

  const handleSyncNow = async () => {
    try {
      const result = await dispatch(processQueue()).unwrap();
      Alert.alert(
        'Sync Complete',
        `Synced ${result.processed} items successfully${
          result.failed > 0 ? `, ${result.failed} failed` : ''
        }`
      );
    } catch (error) {
      Alert.alert('Sync Failed', 'Unable to sync data. Please try again.');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all locally stored data. Unsynced changes will be preserved. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDatabase();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete Firebase token
              await deleteToken();

              // Logout via Redux
              await dispatch(logoutUser()).unwrap();

              // Note: Navigation will automatically switch to auth navigator
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#f44336';
      case 'manager':
        return '#ff9800';
      case 'stock_staff':
        return '#2196f3';
      default:
        return '#4caf50';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'stock_staff':
        return 'Stock Staff';
      default:
        return 'Customer';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info Section */}
      <View style={styles.section}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>

        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>

        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user?.role) }]}>
          <Text style={styles.roleText}>{getRoleLabel(user?.role)}</Text>
        </View>
      </View>

      {/* App Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="cloud-offline" size={20} color="#666" />
            <Text style={styles.settingLabel}>Offline Mode</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={(value) => dispatch(toggleOfflineMode(value))}
            trackColor={{ false: '#ccc', true: '#90caf9' }}
            thumbColor={offlineMode ? '#2196f3' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleSyncNow}
          disabled={syncing}
        >
          <View style={styles.settingLeft}>
            <Icon name="sync" size={20} color="#666" />
            <Text style={styles.settingLabel}>Sync Now</Text>
          </View>
          <View style={styles.settingRight}>
            {queueCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{queueCount}</Text>
              </View>
            )}
            <Icon name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
          <View style={styles.settingLeft}>
            <Icon name="trash-outline" size={20} color="#666" />
            <Text style={styles.settingLabel}>Clear Cache</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="notifications" size={20} color="#666" />
            <Text style={styles.settingLabel}>Enable Notifications</Text>
          </View>
          <Switch
            value={notifications.enabled}
            onValueChange={(value) =>
              dispatch(toggleNotification({ key: 'enabled', value }))
            }
            trackColor={{ false: '#ccc', true: '#90caf9' }}
            thumbColor={notifications.enabled ? '#2196f3' : '#f4f3f4'}
          />
        </View>

        {notifications.enabled && (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="warning-outline" size={20} color="#666" />
                <Text style={styles.settingLabel}>Low Stock Alerts</Text>
              </View>
              <Switch
                value={notifications.lowStock}
                onValueChange={(value) =>
                  dispatch(toggleNotification({ key: 'lowStock', value }))
                }
                trackColor={{ false: '#ccc', true: '#90caf9' }}
                thumbColor={notifications.lowStock ? '#2196f3' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="cube-outline" size={20} color="#666" />
                <Text style={styles.settingLabel}>Inventory Updates</Text>
              </View>
              <Switch
                value={notifications.inventoryUpdates}
                onValueChange={(value) =>
                  dispatch(toggleNotification({ key: 'inventoryUpdates', value }))
                }
                trackColor={{ false: '#ccc', true: '#90caf9' }}
                thumbColor={notifications.inventoryUpdates ? '#2196f3' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="sparkles-outline" size={20} color="#666" />
                <Text style={styles.settingLabel}>New Products</Text>
              </View>
              <Switch
                value={notifications.newProducts}
                onValueChange={(value) =>
                  dispatch(toggleNotification({ key: 'newProducts', value }))
                }
                trackColor={{ false: '#ccc', true: '#90caf9' }}
                thumbColor={notifications.newProducts ? '#2196f3' : '#f4f3f4'}
              />
            </View>
          </>
        )}
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.settingLabel}>App Version</Text>
          </View>
          <Text style={styles.settingValue}>1.0.0</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    width: '100%',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
  },
  badge: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
