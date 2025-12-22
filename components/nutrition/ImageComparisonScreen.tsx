// components/nutrition/ImageComparisonScreen.tsx

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import {
  analyzeAndCompareMealImages,
  MealCompareResult,
} from '../../services/nutritionAIService';

type Props = {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
};

export default function ImageComparisonScreen({ onShowToast }: Props) {
  const [imageAUri, setImageAUri] = useState<string | null>(null);
  const [imageBUri, setImageBUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compareResult, setCompareResult] = useState<MealCompareResult | null>(
    null,
  );
  const [imageSourceModal, setImageSourceModal] = useState<{
    visible: boolean;
    slot: 'A' | 'B' | null;
  }>({ visible: false, slot: null });

  // Show image source selection modal
  const showImageSourceModal = (slot: 'A' | 'B') => {
    setImageSourceModal({ visible: true, slot });
  };

  // Hide image source selection modal
  const hideImageSourceModal = () => {
    setImageSourceModal({ visible: false, slot: null });
  };

  // Take photo with camera
  const takePhoto = async (slot: 'A' | 'B') => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions to take photos.',
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (slot === 'A') {
          setImageAUri(uri);
          console.log('✅ Image A captured:', uri);
        } else {
          setImageBUri(uri);
          console.log('✅ Image B captured:', uri);
        }
        // Clear previous result when new image is selected
        setCompareResult(null);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      onShowToast('Failed to take photo', 'error');
    }
  };

  // Pick image from gallery
  const pickImage = async (slot: 'A' | 'B') => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to select images.',
        );
        return;
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (slot === 'A') {
          setImageAUri(uri);
          console.log('✅ Image A selected:', uri);
        } else {
          setImageBUri(uri);
          console.log('✅ Image B selected:', uri);
        }
        // Clear previous result when new image is selected
        setCompareResult(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      onShowToast('Failed to select image', 'error');
    }
  };

  // Handle image source selection
  const handleImageSourceSelect = async (source: 'camera' | 'gallery') => {
    const slot = imageSourceModal.slot;
    hideImageSourceModal();

    if (!slot) return;

    if (source === 'camera') {
      await takePhoto(slot);
    } else {
      await pickImage(slot);
    }
  };

  // Handle comparison
  const handleCompare = async () => {
    if (!imageAUri || !imageBUri) {
      onShowToast('Please select both images first', 'info');
      return;
    }

    setLoading(true);
    setCompareResult(null);

    try {
      console.log('🧮 Starting analysis...');
      const result = await analyzeAndCompareMealImages(imageAUri, imageBUri);
      console.log('✅ Analysis complete:', result);
      setCompareResult(result);
      onShowToast('Analysis complete!', 'success');
    } catch (error: any) {
      console.error('❌ Analysis error:', error);
      onShowToast(
        error?.message || 'Failed to analyze images. Please try again.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  // Clear all and start over
  const handleReset = () => {
    setImageAUri(null);
    setImageBUri(null);
    setCompareResult(null);
  };

  // Render image picker card
  const renderImagePicker = (
    slot: 'A' | 'B',
    uri: string | null,
    label: string,
  ) => (
    <View style={styles.pickerCard}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.imageBox, uri && styles.imageBoxFilled]}
        onPress={() => showImageSourceModal(slot)}
        activeOpacity={0.7}
      >
        {uri ? (
          <>
            <Image source={{ uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                if (slot === 'A') setImageAUri(null);
                else setImageBUri(null);
                setCompareResult(null);
              }}
            >
              <Ionicons name="close-circle" size={28} color="#FF5252" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={48} color="#CBD5E0" />
            <Text style={styles.placeholderText}>
              Tap to capture or select photo
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render comparison result table
  const renderComparisonTable = () => {
    if (!compareResult) return null;

    const { meal1, meal2, summary } = compareResult;
    const nutrientKeys = Object.keys(meal1.nutrients);

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Ionicons
            name="analytics-outline"
            size={24}
            color={Colors.light.primary}
          />
          <Text style={styles.resultTitle}>Nutrient Analysis</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>
              Nutrient
            </Text>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>
              {meal1.name}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>
              {meal2.name}
            </Text>
          </View>

          {/* Data rows */}
          {nutrientKeys.map((key, index) => (
            <View
              key={key}
              style={[
                styles.tableRow,
                index % 2 === 0 && styles.tableRowEven,
              ]}
            >
              <Text style={[styles.tableCell, styles.nutrientName]}>{key}</Text>
              <Text style={styles.tableCell}>{meal1.nutrients[key]}</Text>
              <Text style={styles.tableCell}>{meal2.nutrients[key]}</Text>
            </View>
          ))}
        </View>

        {/* AI Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryHeader}>
            <Ionicons name="bulb-outline" size={18} color="#9F7AEA" />
            <Text style={styles.summaryTitle}>AI Insight</Text>
          </View>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      </View>
    );
  };

  // Render image source selection modal
  const renderImageSourceModal = () => (
    <Modal
      visible={imageSourceModal.visible}
      transparent
      animationType="fade"
      onRequestClose={hideImageSourceModal}
    >
      <Pressable style={styles.modalOverlay} onPress={hideImageSourceModal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Image Source</Text>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => handleImageSourceSelect('camera')}
            activeOpacity={0.7}
          >
            <View style={styles.modalOptionIcon}>
              <Ionicons name="camera" size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.modalOptionText}>
              <Text style={styles.modalOptionTitle}>Take Photo</Text>
              <Text style={styles.modalOptionSubtitle}>
                Capture with camera
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => handleImageSourceSelect('gallery')}
            activeOpacity={0.7}
          >
            <View style={styles.modalOptionIcon}>
              <Ionicons name="images" size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.modalOptionText}>
              <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
              <Text style={styles.modalOptionSubtitle}>
                Select existing photo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={hideImageSourceModal}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Image Nutrient Analyzer</Text>
        <Text style={styles.subtitle}>
          Capture or select two meal photos to analyze and compare their
          nutritional profiles with AI.
        </Text>
      </View>

      {/* Image pickers */}
      <View style={styles.pickersRow}>
        {renderImagePicker('A', imageAUri, 'Meal A')}
        {renderImagePicker('B', imageBUri, 'Meal B')}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.compareButton,
            (!imageAUri || !imageBUri || loading) &&
              styles.compareButtonDisabled,
          ]}
          onPress={handleCompare}
          disabled={!imageAUri || !imageBUri || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="git-compare-outline" size={20} color="#fff" />
              <Text style={styles.compareButtonText}>Analyze with AI</Text>
            </>
          )}
        </TouchableOpacity>

        {(imageAUri || imageBUri || compareResult) && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color="#718096" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>
            Analyzing meals with AI... This may take a few seconds.
          </Text>
        </View>
      )}

      {/* Comparison result */}
      {!loading && renderComparisonTable()}

      {/* Image source selection modal */}
      {renderImageSourceModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerCard: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  imageBox: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#F7FAFC',
    overflow: 'hidden',
  },
  imageBoxFilled: {
    borderStyle: 'solid',
    borderColor: Colors.light.primary,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  placeholderText: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  compareButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  compareButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetButtonText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableRowEven: {
    backgroundColor: '#F7FAFC',
  },
  tableHeaderRow: {
    backgroundColor: '#EDF2F7',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: Colors.light.text,
    textAlign: 'center',
  },
  tableCellHeader: {
    fontWeight: '700',
    fontSize: 12,
    color: '#4A5568',
  },
  nutrientName: {
    fontWeight: '600',
    textAlign: 'left',
  },
  summaryBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9F7AEA',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  summaryText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    marginBottom: 12,
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  modalOptionSubtitle: {
    fontSize: 13,
    color: '#718096',
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
  },
});
