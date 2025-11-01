import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStockStatus } from '../utils/format';

export default function StockBadge({ quantity, lowThreshold }) {
  const { status, label, color } = getStockStatus(quantity, lowThreshold);

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{quantity} units</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
