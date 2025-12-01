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
  addSymptomLogWithAnalysis,
  analyzeSymptomWithAI,
  deleteSymptomLog,
  getRecentSymptomLogs,
  SymptomAIAnalysis,
} from '../../services/symptomService';
import { SymptomCategory, SymptomFormData, SymptomLog } from '../../types/symptom';

export default function SymptomsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Selection State
  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

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

  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ visible: true, message, type });
  };

  // Load symptom logs
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

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSymptomLogs();
    setRefreshing(false);
  }, [loadSymptomLogs]);

  // Handle category selection
  const handleCategoryPress = (category: SymptomCategory) => {
    if (selectedCategory?.id === category.id) {
      setSelectedCategory(null);
      setShowSymptomPicker(false);
    } else {
      setSelectedCategory(category);
      setShowSymptomPicker(true);
    }
  };

  // Toggle symptom selection
  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  // Remove symptom
  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s !== symptom));
  };

  // Analyze symptoms with AI
  const handleAnalyzeSymptoms = async () => {
    if (!user?.uid || !selectedCategory) return;

    if (selectedSymptoms.length === 0) {
      showToast('Please select at least one symptom', 'warning');
      return;
    }

    try {
      setAnalyzing(true);
      setShowSymptomPicker(false);

      const formData: SymptomFormData = {
        category: selectedCategory.id,
        categoryName: selectedCategory.name,
        symptoms: selectedSymptoms,
        severity: 3,
        duration: 'days',
        durationValue: 1,
      };

      const analysis = await analyzeSymptomWithAI(formData);
      setAIAnalysis(analysis);
      setShowAIAnalysis(true);
    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      showToast(error.message || 'Failed to analyze symptoms', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  // Save symptom log with AI analysis
  const handleSaveAnalysis = async () => {
    if (!user?.uid || !selectedCategory || !aiAnalysis) return;

    try {
      setSaving(true);

      const formData: SymptomFormData = {
        category: selectedCategory.id,
        categoryName: selectedCategory.name,
        symptoms: selectedSymptoms,
        severity: 3,
        duration: 'days',
        durationValue: 1,
      };

      await addSymptomLogWithAnalysis(user.uid, formData, aiAnalysis);

      showToast('Symptom analysis saved successfully!', 'success');

      // Reset form
      setSelectedCategory(null);
      setSelectedSymptoms([]);
      setAIAnalysis(null);
      setShowAIAnalysis(false);

      // Reload logs
      await loadSymptomLogs();
    } catch (error) {
      console.error('Error saving symptom log:', error);
      showToast('Failed to save symptom analysis', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Show delete confirmation
  const handleDeleteLog = (symptomId: string) => {
    setDeleteTargetId(symptomId);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
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

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Toast */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Selected Symptoms Bar */}
      <SelectedSymptomsBar symptoms={selectedSymptoms} onRemove={removeSymptom} />

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
            Select a body part below, choose symptoms, then click "Analyze" for AI insights
          </Text>
        </View>

        {/* Category Grid */}
        <View style={styles.categoriesGrid}>
          {SYMPTOM_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory?.id === category.id}
              onPress={() => handleCategoryPress(category)}
            />
          ))}
        </View>

        {/* Recent Logs */}
        {symptomLogs.length > 0 && (
          <View style={styles.logsSection}>
            <Text style={styles.sectionTitle}>Recent Symptom Logs</Text>
            <FlatList
              data={symptomLogs}
              renderItem={({ item }) => <SymptomLogCard log={item} onDelete={handleDeleteLog} />}
              keyExtractor={(item) => item.symptomId}
              scrollEnabled={false}
            />
          </View>
        )}

        {symptomLogs.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color={Colors.light.border} />
            <Text style={styles.emptyTitle}>No Symptoms Logged Yet</Text>
            <Text style={styles.emptyText}>
              Start tracking your symptoms by selecting a body part above
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Symptom Picker Modal */}
      <SymptomPickerModal
        visible={showSymptomPicker}
        category={selectedCategory}
        selectedSymptoms={selectedSymptoms}
        onClose={() => setShowSymptomPicker(false)}
        onToggleSymptom={toggleSymptom}
        onAnalyze={handleAnalyzeSymptoms}
      />

      {/* AI Analysis Result Modal */}
      <AIAnalysisModal
        visible={showAIAnalysis}
        analysis={aiAnalysis}
        onClose={() => setShowAIAnalysis(false)}
        onSave={handleSaveAnalysis}
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
  logsSection: {
    marginTop: 5,
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
