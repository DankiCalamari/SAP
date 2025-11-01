import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Vibration,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';

export default function BarcodeScannerScreen() {
  const navigation = useNavigation();
  const [scanned, setScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  const handleBarcodeScan = async ({ data }) => {
    if (scanned) return;

    setScanned(true);
    Vibration.vibrate(100);

    try {
      // Fetch product by barcode
      const response = await api.getProductByBarcode(data);
      const product = response.data;

      // Navigate to product detail
      navigation.replace('ProductDetail', { productId: product.id });
    } catch (error) {
      console.error('Error fetching product:', error);

      Alert.alert(
        'Product Not Found',
        'No product found with this barcode',
        [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleManualSubmit = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }

    try {
      const response = await api.getProductByBarcode(manualBarcode);
      const product = response.data;

      setShowManualInput(false);
      navigation.replace('ProductDetail', { productId: product.id });
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Product Not Found', 'No product found with this barcode');
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <RNCamera
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        onBarCodeRead={handleBarcodeScan}
        barCodeTypes={[
          RNCamera.Constants.BarCodeType.ean13,
          RNCamera.Constants.BarCodeType.ean8,
          RNCamera.Constants.BarCodeType.code128,
          RNCamera.Constants.BarCodeType.upce,
          RNCamera.Constants.BarCodeType.upc_e,
        ]}
        captureAudio={false}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top Section */}
          <View style={styles.topOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Middle Section with Scanning Frame */}
          <View style={styles.middleOverlay}>
            <View style={styles.leftOverlay} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.rightOverlay} />
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>Point camera at barcode</Text>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowManualInput(true)}
            >
              <Icon name="keypad" size={20} color="#fff" />
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNCamera>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Barcode</Text>
              <TouchableOpacity onPress={() => setShowManualInput(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter barcode number"
              placeholderTextColor="#999"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="number-pad"
              autoFocus
            />

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleManualSubmit}
            >
              <Text style={styles.modalSubmitButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleOverlay: {
    flexDirection: 'row',
    height: 250,
  },
  leftOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  rightOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  manualButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalInput: {
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalSubmitButton: {
    height: 48,
    backgroundColor: '#2196f3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
