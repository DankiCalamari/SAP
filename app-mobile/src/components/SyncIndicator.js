import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import { loadQueueCount } from '../store/syncSlice';
import { subscribeToNetworkStatus } from '../utils/network';

export default function SyncIndicator() {
  const dispatch = useDispatch();
  const { queueCount, syncing, lastSync } = useSelector((state) => state.sync);
  const [isOnline, setIsOnline] = React.useState(true);

  useEffect(() => {
    // Load initial queue count
    dispatch(loadQueueCount());

    // Subscribe to network status changes
    const unsubscribe = subscribeToNetworkStatus((online) => {
      setIsOnline(online);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dispatch]);

  const getStatusIcon = () => {
    if (syncing) {
      return <ActivityIndicator size="small" color="#ff9800" />;
    }

    if (!isOnline) {
      return <Icon name="wifi-off" size={20} color="#f44336" />;
    }

    if (queueCount > 0) {
      return <Icon name="time" size={20} color="#ff9800" />;
    }

    return <Icon name="checkmark-circle" size={20} color="#4caf50" />;
  };

  const getStatusText = () => {
    if (syncing) {
      return 'Syncing...';
    }

    if (!isOnline) {
      return 'Offline';
    }

    if (queueCount > 0) {
      return `${queueCount} pending`;
    }

    return '';
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7}>
      <View style={styles.content}>
        {getStatusIcon()}
        {getStatusText() && (
          <Text style={styles.text}>{getStatusText()}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    padding: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
