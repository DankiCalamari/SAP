import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { formatCurrency } from '../utils/format';
import StockBadge from './StockBadge';

export default function ProductCard({ product, onPress, showStock = true }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.container}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>

          <Text style={styles.sku}>SKU: {product.sku}</Text>

          <View style={styles.bottomRow}>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>

            {showStock && product.inventory && (
              <StockBadge
                quantity={product.inventory.quantity}
                lowThreshold={product.inventory.low_stock_threshold}
              />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    width: 64,
    height: 64,
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sku: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
});
