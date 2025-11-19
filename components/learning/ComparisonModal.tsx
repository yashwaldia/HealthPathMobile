import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PATHOLOGY_TESTS, RADIOLOGY_TESTS } from '../../constants/learningData';
import { PathologyTest, RadiologyTest } from '../../types/learning';

interface ComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  comparisonList: string[];
  onUpdateComparison: (list: string[]) => void;
  testType: 'pathology' | 'radiology';
}

export default function ComparisonModal({
  visible,
  onClose,
  comparisonList,
  onUpdateComparison,
  testType,
}: ComparisonModalProps) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Get the appropriate test list
  const allTests = testType === 'pathology' ? PATHOLOGY_TESTS : RADIOLOGY_TESTS;

  // Get selected tests
  const selectedTests = useMemo(() => {
    return allTests.filter((test) => comparisonList.includes(test.id));
  }, [comparisonList, allTests]);

  const handleToggleTest = (testId: string) => {
    if (comparisonList.includes(testId)) {
      onUpdateComparison(comparisonList.filter((id) => id !== testId));
    } else if (comparisonList.length < 3) {
      onUpdateComparison([...comparisonList, testId]);
    }
  };

  const isPathologyTest = (test: any): test is PathologyTest => {
    return 'detects' in test;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Learning Zone</Text>
            <Text style={styles.headerSubtitle}>
              Compare up to 3 tests ({comparisonList.length}/3)
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Test Selection List */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Select Tests to Compare</Text>
              {allTests.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={[
                    styles.testCheckbox,
                    comparisonList.includes(test.id) && styles.testCheckboxSelected,
                  ]}
                  onPress={() => handleToggleTest(test.id)}
                  disabled={
                    !comparisonList.includes(test.id) && comparisonList.length >= 3
                  }
                >
                  <Ionicons
                    name={
                      comparisonList.includes(test.id)
                        ? 'checkbox'
                        : 'square-outline'
                    }
                    size={24}
                    color={
                      comparisonList.includes(test.id)
                        ? Colors.light.primary
                        : Colors.light.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.testCheckboxText,
                      comparisonList.includes(test.id) &&
                        styles.testCheckboxTextSelected,
                    ]}
                  >
                    {test.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Comparison Table */}
            {selectedTests.length > 0 && (
              <View style={styles.comparisonSection}>
                <Text style={styles.sectionTitle}>Comparison</Text>

                {/* Purpose Row */}
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonLabelCell}>
                    <Ionicons
                      name="information-circle"
                      size={18}
                      color={Colors.light.primary}
                    />
                    <Text style={styles.comparisonLabel}>Purpose</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.comparisonDataRow}>
                      {selectedTests.map((test) => (
                        <View key={test.id} style={styles.comparisonDataCell}>
                          <Text style={styles.comparisonTestName}>
                            {test.name}
                          </Text>
                          <Text style={styles.comparisonData}>
                            {test.purpose}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Pathology-specific rows */}
                {selectedTests.length > 0 && isPathologyTest(selectedTests[0]) && (
                  <>
                    {/* Detects Row */}
                    <View style={styles.comparisonRow}>
                      <View style={styles.comparisonLabelCell}>
                        <Ionicons
                          name="search"
                          size={18}
                          color={Colors.light.primary}
                        />
                        <Text style={styles.comparisonLabel}>Detects</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.comparisonDataRow}>
                          {selectedTests.map((test) => (
                            <View key={test.id} style={styles.comparisonDataCell}>
                              <Text style={styles.comparisonData}>
                                {isPathologyTest(test) ? test.detects : 'N/A'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Normal Range Row */}
                    <View style={styles.comparisonRow}>
                      <View style={styles.comparisonLabelCell}>
                        <Ionicons
                          name="stats-chart"
                          size={18}
                          color={Colors.light.primary}
                        />
                        <Text style={styles.comparisonLabel}>Normal Range</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.comparisonDataRow}>
                          {selectedTests.map((test) => (
                            <View key={test.id} style={styles.comparisonDataCell}>
                              <Text style={styles.comparisonData}>
                                {isPathologyTest(test) ? test.normalRange : 'N/A'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Sample Type Row */}
                    <View style={styles.comparisonRow}>
                      <View style={styles.comparisonLabelCell}>
                        <Ionicons
                          name="water"
                          size={18}
                          color={Colors.light.primary}
                        />
                        <Text style={styles.comparisonLabel}>Sample Type</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.comparisonDataRow}>
                          {selectedTests.map((test) => (
                            <View key={test.id} style={styles.comparisonDataCell}>
                              <Text style={styles.comparisonData}>
                                {isPathologyTest(test) ? test.sampleType : 'N/A'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Interpretation Tips Row */}
                    <View style={styles.comparisonRow}>
                      <View style={styles.comparisonLabelCell}>
                        <Ionicons
                          name="bulb"
                          size={18}
                          color={Colors.light.primary}
                        />
                        <Text style={styles.comparisonLabel}>Interpretation</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.comparisonDataRow}>
                          {selectedTests.map((test) => (
                            <View key={test.id} style={styles.comparisonDataCell}>
                              <Text style={styles.comparisonData}>
                                {isPathologyTest(test)
                                  ? test.interpretationTips
                                  : 'N/A'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </>
                )}

                {/* Radiology-specific row */}
                {selectedTests.length > 0 && !isPathologyTest(selectedTests[0]) && (
                  <View style={styles.comparisonRow}>
                    <View style={styles.comparisonLabelCell}>
                      <Ionicons
                        name="folder"
                        size={18}
                        color={Colors.light.primary}
                      />
                      <Text style={styles.comparisonLabel}>Sub Category</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.comparisonDataRow}>
                        {selectedTests.map((test) => (
                          <View key={test.id} style={styles.comparisonDataCell}>
                            <Text style={styles.comparisonData}>
                              {'subCategory' in test ? test.subCategory : 'N/A'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Cost Row */}
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonLabelCell}>
                    <Ionicons name="cash" size={18} color={Colors.light.primary} />
                    <Text style={styles.comparisonLabel}>Cost</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.comparisonDataRow}>
                      {selectedTests.map((test) => (
                        <View key={test.id} style={styles.comparisonDataCell}>
                          <Text style={styles.comparisonData}>
                            {test.cost || 'N/A'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Duration Row */}
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonLabelCell}>
                    <Ionicons name="time" size={18} color={Colors.light.primary} />
                    <Text style={styles.comparisonLabel}>Duration</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.comparisonDataRow}>
                      {selectedTests.map((test) => (
                        <View key={test.id} style={styles.comparisonDataCell}>
                          <Text style={styles.comparisonData}>
                            {test.duration || 'N/A'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {selectedTests.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="git-compare-outline"
                  size={64}
                  color={Colors.light.textLight}
                />
                <Text style={styles.emptyStateText}>No tests selected</Text>
                <Text style={styles.emptyStateSubtext}>
                  Select tests from the list above to compare
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '95%',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    marginBottom: 12,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  selectionSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  testCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  testCheckboxSelected: {
    backgroundColor: Colors.light.primary + '10',
    borderColor: Colors.light.primary,
  },
  testCheckboxText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  testCheckboxTextSelected: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  comparisonSection: {
    marginBottom: 20,
  },
  comparisonRow: {
    marginBottom: 16,
  },
  comparisonLabelCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  comparisonDataRow: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonDataCell: {
    width: 250,
    padding: 12,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  comparisonTestName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  comparisonData: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
