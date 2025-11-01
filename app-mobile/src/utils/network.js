import NetInfo from '@react-native-community/netinfo';

/**
 * Check if device is connected to network
 */
export const isConnected = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable;
};

/**
 * Subscribe to network status changes
 */
export const subscribeToNetworkStatus = (callback) => {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected && state.isInternetReachable);
  });
};

/**
 * Get current network type (wifi, cellular, etc.)
 */
export const getNetworkType = async () => {
  const state = await NetInfo.fetch();
  return state.type;
};

export default {
  isConnected,
  subscribeToNetworkStatus,
  getNetworkType,
};
