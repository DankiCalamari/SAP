import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { submitAdjustment } from '../store/inventorySlice';
import { searchProducts } from '../store/productsSlice';
import api from '../services/api';
import { isConnected } from '../utils/network';

export default function InventoryAdjustScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const passedProductId = route.params?.productId;

  const [product, setProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'remove'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (passedProductId) {
      loadProduct(passedProductId);
    }
  }, [passedProductId]);

  const loadProduct = async (productId) => {
    try {
      const response = await api.getProductById(productId);
      setProduct(response.data);
    } catch (error) {
      console.error('Error loading product:', error);
    }
  };

  const handleSearchProducts = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await api.searchProducts(searchQuery);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProduct = (selectedProduct) => {
    setProduct(selectedProduct);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!product) {
      setError('Please select a product');
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (!reason) {
      setError('Please select a reason');
      return;
    }

    if (reason === 'Other' && !notes.trim()) {
      setError('Please provide notes for "Other" reason');
      return;
    }

    try {
      setSubmitting(true);

      // Calculate final quantity (negative for removal)
      const finalQuantity = adjustmentType === 'add' ? parseInt(quantity) : -parseInt(quantity);

      // Check if online
      const online = await isConnected();

      await dispatch(
        submitAdjustment({
          productId: product.id,
          quantity: finalQuantity,
          reason,
          notes,
          offline: !online,
        })
      ).unwrap();

      Alert.alert(
        'Success',
        online ? 'Inventory adjusted successfully' : 'Adjustment queued for sync',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting adjustment:', error);
      setError('Failed to submit adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const reasonOptions = {
    add: ['Restock', 'Return to inventory', 'Correction', 'Other'],
    remove: ['Damaged', 'Theft', 'Correction', 'Transfer', 'Other'],
  };

  const currentReasons = reasonOptions[adjustmentType];

  const newStockCalculation = () => {
    if (!product || !product.inventory || !quantity) return null;

    const currentStock = product.inventory.quantity || 0;
    const change = adjustmentType === 'add' ? parseInt(quantity) : -parseInt(quantity);
    const newStock = currentStock + change;

    return { currentStock, change, newStock };
  };

  const calc = newStockCalculation();

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Product Selection */}
      {!product ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Product</Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search product to adjust..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchProducts}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchProducts}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('BarcodeScanner')}
          >
            <Icon name="scan" size={20} color="#2196f3" />
            <Text style={styles.scanButtonText}>Scan Barcode</Text>
          </TouchableOpacity>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultItem}
                  onPress={() => handleSelectProduct(item)}
                >
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultSku}>SKU: {item.sku}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : (
        <>
          {/* Product Display */}
          <View style={styles.section}>
            <View style={styles.productDisplay}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSku}>SKU: {product.sku}</Text>
                {product.inventory && (
                  <Text style={styles.currentStock}>
                    Current Stock: {product.inventory.quantity} units
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setProduct(null)}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Adjustment Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adjustment Type</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  adjustmentType === 'add' && styles.radioButtonActive,
                ]}
                onPress={() => setAdjustmentType('add')}
              >
                <Icon
                  name={adjustmentType === 'add' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={adjustmentType === 'add' ? '#2196f3' : '#999'}
                />
                <Text style={styles.radioLabel}>Add Stock</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioButton,
                  adjustmentType === 'remove' && styles.radioButtonActive,
                ]}
                onPress={() => setAdjustmentType('remove')}
              >
                <Icon
                  name={adjustmentType === 'remove' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={adjustmentType === 'remove' ? '#2196f3' : '#999'}
                />
                <Text style={styles.radioLabel}>Remove Stock</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter quantity"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Reason</Text>
            <View style={styles.reasonButtons}>
              {currentReasons.map((reasonOption) => (
                <TouchableOpacity
                  key={reasonOption}
                  style={[
                    styles.reasonButton,
                    reason === reasonOption && styles.reasonButtonActive,
                  ]}
                  onPress={() => setReason(reasonOption)}
                >
                  <Text
                    style={[
                      styles.reasonButtonText,
                      reason === reasonOption && styles.reasonButtonTextActive,
                    ]}
                  >
                    {reasonOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Notes {reason === 'Other' && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes..."
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* New Stock Calculation */}
          {calc && (
            <View style={styles.calculationBox}>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Current:</Text>
                <Text style={styles.calculationValue}>{calc.currentStock} units</Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Adjustment:</Text>
                <Text
                  style={[
                    styles.calculationValue,
                    { color: calc.change >= 0 ? '#4caf50' : '#f44336' },
                  ]}
                >
                  {calc.change >= 0 ? '+' : ''}
                  {calc.change} units
                </Text>
              </View>
              <View style={[styles.calculationRow, styles.calculationRowTotal]}>
                <Text style={styles.calculationLabelTotal}>New Total:</Text>
                <Text style={styles.calculationValueTotal}>{calc.newStock} units</Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Adjustment</Text>
              )}
            </TouchableOpacity>
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
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    marginRight: 8,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: '#2196f3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#2196f3',
    borderRadius: 8,
  },
  scanButtonText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    marginTop: 12,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  resultSku: {
    fontSize: 12,
    color: '#999',
  },
  productDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  currentStock: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196f3',
  },
  changeButton: {
    padding: 8,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radioButtonActive: {},
  radioLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  input: {
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1a1a1a',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  reasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  reasonButtonActive: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  reasonButtonText: {
    fontSize: 14,
    color: '#666',
  },
  reasonButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  calculationBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calculationRowTotal: {
    borderTopWidth: 2,
    borderTopColor: '#2196f3',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#666',
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  calculationLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  calculationValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    height: 48,
    backgroundColor: '#2196f3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#90caf9',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
