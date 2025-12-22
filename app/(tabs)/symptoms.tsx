// app/(tabs)/symptoms.tsx
// ✅ REFACTORED: Bulk category selection + main analyze button + View AI Analysis from history
// Last Updated: December 19, 2025

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AIAnalysisModal from '../../components/symptoms/AIAnalysisModal';
import CategoryCard from '../../components/symptoms/CategoryCard';
import SelectedSymptomsBar from '../../components/symptoms/SelectedSymptomsBar';
import SymptomLogCard from '../../components/symptoms/SymptomLogCard';
import SymptomPickerModal from '../../components/symptoms/SymptomPickerModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CustomToast from '../../components/ui/CustomToast';
import { Colors } from '../../constants/colors';
import { SYMPTOM_CATEGORIES } from '../../constants/symptomData';
import { useAuth } from '../../context/AuthContext';
import {
  addBulkSymptomLogWithAnalysis,
  analyzeMultipleCategoriesWithAI,
  deleteSymptomLog,
  getRecentSymptomLogs,
  SymptomAIAnalysis,
} from '../../services/symptomService';
import { SymptomCategory, SymptomLog } from '../../types/symptom';

// ✅ NEW: Type for categorized symptoms
interface CategorizedSymptoms {
  [categoryId: string]: {
    categoryName: string;
    symptoms: string[];
  };
}

export default function SymptomsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // ✅ NEW: Store symptoms grouped by category
  const [categorizedSymptoms, setCategorizedSymptoms] = useState<CategorizedSymptoms>({});
  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory | null>(null);

  // Modal States
  const [showSymptomPicker, setShowSymptomPicker] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  // Data States
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<SymptomAIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // ✅ NEW: Track if viewing analysis from history (read-only mode)
  const [isViewingHistoryAnalysis, setIsViewingHistoryAnalysis] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ visible: true, message, type });
  };

  const loadSymptomLogs = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const logs = await getRecentSymptomLogs(user.uid, 50);
      setSymptomLogs(logs);
    } catch (error) {
      console.error('Error loading symptom logs:', error);
      showToast('Failed to load symptom history', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSymptomLogs();
  }, [loadSymptomLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSymptomLogs();
    setRefreshing(false);
  }, [loadSymptomLogs]);

  // ✅ NEW: Handle category press - open symptom picker
  const handleCategoryPress = (category: SymptomCategory) => {
    setSelectedCategory(category);
    setShowSymptomPicker(true);
  };

  // ✅ NEW: Get current category's selected symptoms
  const getCurrentCategorySymptoms = (): string[] => {
    if (!selectedCategory) return [];
    return categorizedSymptoms[selectedCategory.id]?.symptoms || [];
  };

  // ✅ NEW: Toggle symptom in current category
  const toggleSymptom = (symptom: string) => {
    if (!selectedCategory) return;

    setCategorizedSymptoms(prev => {
      const categoryId = selectedCategory.id;
      const currentSymptoms = prev[categoryId]?.symptoms || [];
      
      const newSymptoms = currentSymptoms.includes(symptom)
        ? currentSymptoms.filter(s => s !== symptom)
        : [...currentSymptoms, symptom];

      // If no symptoms left, remove category entirely
      if (newSymptoms.length === 0) {
        const { [categoryId]: removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [categoryId]: {
          categoryName: selectedCategory.name,
          symptoms: newSymptoms,
        },
      };
    });
  };

  // ✅ NEW: Remove specific symptom from specific category
  const removeSymptom = (categoryId: string, symptom: string) => {
    setCategorizedSymptoms(prev => {
      const currentSymptoms = prev[categoryId]?.symptoms || [];
      const newSymptoms = currentSymptoms.filter(s => s !== symptom);

      if (newSymptoms.length === 0) {
        const { [categoryId]: removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          symptoms: newSymptoms,
        },
      };
    });
  };

  // ✅ NEW: Clear all symptoms from a category
  const clearCategory = (categoryId: string) => {
    setCategorizedSymptoms(prev => {
      const { [categoryId]: removed, ...rest } = prev;
      return rest;
    });
  };

  // ✅ NEW: Get total symptom count
  const getTotalSymptomCount = (): number => {
    return Object.values(categorizedSymptoms).reduce(
      (total, cat) => total + cat.symptoms.length,
      0
    );
  };

  // ✅ NEW: Analyze all selected symptoms
  const handleAnalyzeAllSymptoms = async () => {
    if (!user?.uid) return;

    const totalSymptoms = getTotalSymptomCount();
    if (totalSymptoms === 0) {
      showToast('Please select at least one symptom', 'warning');
      return;
    }

    try {
      setAnalyzing(true);

      // Convert to array format for API
      const symptomsArray = Object.entries(categorizedSymptoms).map(([catId, data]) => ({
        category: catId,
        categoryName: data.categoryName,
        symptoms: data.symptoms,
      }));

      const analysis = await analyzeMultipleCategoriesWithAI(symptomsArray);
      setAIAnalysis(analysis);
      setIsViewingHistoryAnalysis(false); // New analysis, can be saved
      setShowAIAnalysis(true);
    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      showToast(error.message || 'Failed to analyze symptoms', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  // ✅ NEW: View AI analysis from history log
  const handleViewAnalysis = (log: SymptomLog) => {
    if (log.aiAnalysis) {
      setAIAnalysis(log.aiAnalysis);
      setIsViewingHistoryAnalysis(true); // Read-only mode
      setShowAIAnalysis(true);
    }
  };

  // ✅ NEW: Save bulk analysis
  const handleSaveAnalysis = async () => {
    if (!user?.uid || !aiAnalysis) return;

    try {
      setSaving(true);

      const symptomsArray = Object.entries(categorizedSymptoms).map(([catId, data]) => ({
        category: catId,
        categoryName: data.categoryName,
        symptoms: data.symptoms,
      }));

      await addBulkSymptomLogWithAnalysis(user.uid, symptomsArray, aiAnalysis);

      showToast('Symptom analysis saved successfully!', 'success');

      // Reset form
      setCategorizedSymptoms({});
      setAIAnalysis(null);
      setShowAIAnalysis(false);
      setIsViewingHistoryAnalysis(false);

      // Reload logs
      await loadSymptomLogs();
    } catch (error) {
      console.error('Error saving symptom log:', error);
      showToast('Failed to save symptom analysis', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = (symptomId: string) => {
    setDeleteTargetId(symptomId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!user?.uid || !deleteTargetId) return;

    try {
      await deleteSymptomLog(user.uid, deleteTargetId);
      await loadSymptomLogs();
      showToast('Symptom log deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete symptom log', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  // ✅ NEW: Check if category has symptoms selected
  const categoryHasSymptoms = (categoryId: string): boolean => {
    return (categorizedSymptoms[categoryId]?.symptoms.length || 0) > 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Symptom Tracker</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading symptoms...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalSymptoms = getTotalSymptomCount();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ✅ NEW: Enhanced Selected Symptoms Bar */}
      <SelectedSymptomsBar
        categorizedSymptoms={categorizedSymptoms}
        onRemoveSymptom={removeSymptom}
        onClearCategory={clearCategory}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.instructionsText}>
            Select body parts and add symptoms. Use "Analyze Symptoms" button below for AI insights
          </Text>
        </View>

        {/* Category Grid */}
        <View style={styles.categoriesGrid}>
          {SYMPTOM_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory?.id === category.id}
              hasSymptoms={categoryHasSymptoms(category.id)}
              symptomCount={categorizedSymptoms[category.id]?.symptoms.length || 0}
              onPress={() => handleCategoryPress(category)}
            />
          ))}
        </View>

        {/* ✅ NEW: Main Analyze Button (only shows when symptoms selected) */}
        {totalSymptoms > 0 && (
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleAnalyzeAllSymptoms}
            disabled={analyzing}
          >
            <Ionicons name="sparkles" size={20} color="white" />
            <Text style={styles.analyzeButtonText}>
              Analyze {totalSymptoms} Symptom{totalSymptoms !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Recent Logs */}
        {symptomLogs.length > 0 && (
          <View style={styles.logsSection}>
            <Text style={styles.sectionTitle}>Recent Symptom Logs</Text>
            <FlatList
              data={symptomLogs}
              renderItem={({ item }) => (
                <SymptomLogCard
                  log={item}
                  onDelete={handleDeleteLog}
                  onViewAnalysis={handleViewAnalysis}
                />
              )}
              keyExtractor={(item) => item.symptomId}
              scrollEnabled={false}
            />
          </View>
        )}

        {symptomLogs.length === 0 && totalSymptoms === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color={Colors.light.border} />
            <Text style={styles.emptyTitle}>No Symptoms Logged Yet</Text>
            <Text style={styles.emptyText}>
              Start tracking your symptoms by selecting a body part above
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ✅ UPDATED: Symptom Picker Modal (removed analyze button) */}
      <SymptomPickerModal
        visible={showSymptomPicker}
        category={selectedCategory}
        selectedSymptoms={getCurrentCategorySymptoms()}
        onClose={() => {
          setShowSymptomPicker(false);
          setSelectedCategory(null);
        }}
        onToggleSymptom={toggleSymptom}
      />

      {/* ✅ UPDATED: AI Analysis Result Modal with conditional save button */}
      <AIAnalysisModal
        visible={showAIAnalysis}
        analysis={aiAnalysis}
        onClose={() => {
          setShowAIAnalysis(false);
          setIsViewingHistoryAnalysis(false);
        }}
        onSave={isViewingHistoryAnalysis ? undefined : handleSaveAnalysis}
        saving={saving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Symptom Log"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Analyzing Overlay */}
      {analyzing && (
        <View style={styles.analyzingOverlay}>
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.analyzingText}>Analyzing symptoms with AI...</Text>
            <Text style={styles.analyzingSubtext}>This may take a few seconds</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.light.primary}10`,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  // ✅ NEW: Main analyze button styles
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
    gap: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  analyzingContainer: {
    backgroundColor: Colors.light.cardBackground,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 280,
  },
  analyzingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  analyzingSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
});
